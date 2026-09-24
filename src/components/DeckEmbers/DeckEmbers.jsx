import { useEffect, useRef } from 'react'
import styles from './DeckEmbers.module.css'

/**
 * Short-lived squares streaming off the outside edge of a card, each one lighting
 * the stretch of rim it broke through.
 *
 * Every particle is born ON the perimeter and pushed straight outward, away from
 * the centre, so the card looks like it is shedding rather than emitting from a
 * point. They fade out within about a second.
 *
 * There is no border at rest. The only lit pixels are the stretch of edge nearest
 * a spark, which is what makes it read as the rim catching the light rather than
 * as a glow sitting on top of the card. A card using this should therefore not
 * also draw a static outline: the two fight, and the flat one wins.
 *
 * ## Placement
 *
 * The canvas measures its own NEXT SIBLING and expects to sit inside a positioned
 * wrapper, because it is inset NEGATIVELY by `pad` to cover the card plus a
 * margin: a particle has to keep travelling after it leaves the edge, and a
 * canvas clipped to the card would cut every one off at birth. No ancestor
 * between here and that wrapper may set `overflow: hidden`.
 *
 * @param {string} [color]    hex, e.g. '#e867ff', or a custom property name,
 *        e.g. '--accent', read from the canvas's computed style so the token
 *        stays the single source of truth
 * @param {string} [className] extra class, for z-index in its own context
 * @param {'rect'|'circle'} [shape] 'circle' treats the sibling as an ellipse
 *        filling its box: sparks are born on the curve and the rim is an arc.
 *        A rect with a huge radius draws the same ring, but spawns from the
 *        empty corners of the box.
 * @param {number} [radius]   corner radius of the sibling being outlined (rect only)
 * @param {number} [pad]      px of canvas beyond the card on every side, and so
 *        how far a particle can travel before it is clipped. Worth lowering in a
 *        tight grid, where a wide pad throws sparks over the next card along.
 * @param {number} [rate]     particles per second
 * @param {number} [inflate]  px to grow the measured box by before it is stroked.
 *        For a rim that sits off the element's edge rather than on it -- matching
 *        an `outline-offset`, say. The radius grows with it so the ring stays
 *        concentric instead of squaring off at the corners.
 * @param {number} [speed]    playback speed, 1 = default. Below 1 the sparks move
 *        slower and live longer in proportion, so they still travel as far.
 * @param {number} [glow]     brightness and reach of the rim flare, 1 = default
 */

const LIFE = [0.45, 1.1] // seconds
const SIZE = [2, 5] // px per side
const SPEED = [26, 78] // px per second, outward
const SPREAD = 0.5 // radians of jitter off the outward normal
const MAX = 90 // hard ceiling, in case a tab resumes after a stall
const FLASH_LIFE = [0.25, 0.55] // seconds
const FLASH_REACH = [13, 32] // px of border lit either side of the spark
const BORDER_WIDTH = 2 // px

const rand = (a, b) => a + Math.random() * (b - a)

// Gradient stops need channels, and the accent arrives as a hex string.
function toRgb(hex) {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const n = parseInt(full, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

export default function DeckEmbers({
  color = '#fff',
  className,
  shape = 'rect',
  radius = 16,
  pad = 64,
  rate = 6,
  inflate = 0,
  speed = 1,
  glow = 1,
}) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion) return // the whole effect is motion; nothing to show statically

    const fill = color.startsWith('--')
      ? getComputedStyle(canvas).getPropertyValue(color).trim() || '#fff'
      : color

    let raf = 0
    let w = 0
    let h = 0
    let last = performance.now()
    let carry = 0 // fractional particles owed since the last frame
    const parts = []
    const flashes = []
    const [cr_, cg_, cb_] = toRgb(fill)
    const ringRadius = radius + inflate

    // The card's box in canvas coordinates. MEASURED, not assumed: the canvas is
    // sized from the wrapper, and the sibling may be narrower than the canvas
    // minus pad. Spawning off the canvas box put the particles out in empty
    // space beside the card.
    let box = { left: pad, top: pad, w: 0, h: 0 }

    const measureCard = () => {
      const card = canvas.nextElementSibling
      if (!card) return

      // LAYOUT offsets, not getBoundingClientRect. A rect includes the
      // element's own transform, and what this outlines may be transformed
      // (entry animations, hover lifts). A ResizeObserver sees size changes,
      // and a translate is not one, so a rect taken mid-animation stays wrong.
      // offsetLeft/offsetWidth report the untransformed border box, so the ring
      // anchors to where the card actually lives. They round to whole pixels.
      //
      // The subtraction is only meaningful because both boxes are offset from
      // the same ancestor. If a caller breaks that, fall back to rects rather
      // than drawing the ring somewhere arbitrary.
      if (card.offsetParent && card.offsetParent === canvas.offsetParent) {
        box = {
          left: card.offsetLeft - canvas.offsetLeft - inflate,
          top: card.offsetTop - canvas.offsetTop - inflate,
          w: card.offsetWidth + inflate * 2,
          h: card.offsetHeight + inflate * 2,
        }
        return
      }

      const cr = card.getBoundingClientRect()
      const vr = canvas.getBoundingClientRect()
      box = {
        left: cr.left - vr.left - inflate,
        top: cr.top - vr.top - inflate,
        w: cr.width + inflate * 2,
        h: cr.height + inflate * 2,
      }
    }

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const spawn = () => {
      const { left, top, w: cw, h: ch } = box
      if (cw <= 0 || ch <= 0) return
      const cx = left + cw / 2
      const cy = top + ch / 2
      let x
      let y
      let normal

      if (shape === 'circle') {
        // Uniform around the curve; on a circle the outward normal is the angle itself.
        normal = rand(0, Math.PI * 2)
        x = cx + (cw / 2) * Math.cos(normal)
        y = cy + (ch / 2) * Math.sin(normal)
      } else {
        const right = left + cw
        const bottom = top + ch
        // Pick a side weighted by its length, so a long edge is not starved by a
        // short one.
        const perim = 2 * (cw + ch)
        let t = rand(0, perim)
        if (t < cw) { x = left + t; y = top }
        else if ((t -= cw) < ch) { x = right; y = top + t }
        else if ((t -= ch) < cw) { x = right - t; y = bottom }
        else { t -= cw; x = left; y = bottom - t }
        // Straight out from the centre.
        normal = Math.atan2(y - cy, x - cx)
      }

      // A little spread so the stream is not a set of perfectly radial lines.
      const angle = normal + rand(-SPREAD, SPREAD)
      const velocity = rand(...SPEED) * speed

      parts.push({
        x,
        y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        size: rand(...SIZE),
        age: 0,
        life: rand(...LIFE) / speed,
      })

      // The rim flare, at the exact point the particle left.
      flashes.push({ x, y, age: 0, life: rand(...FLASH_LIFE) / speed, r: rand(...FLASH_REACH) * glow })
    }

    const step = (dt) => {
      carry += rate * dt
      while (carry >= 1) {
        if (parts.length < MAX) spawn()
        carry -= 1
      }

      for (let i = flashes.length - 1; i >= 0; i--) {
        const f = flashes[i]
        f.age += dt
        if (f.age >= f.life) flashes.splice(i, 1)
      }

      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i]
        p.age += dt
        if (p.age >= p.life) {
          parts.splice(i, 1)
          continue
        }
        p.x += p.vx * dt
        p.y += p.vy * dt
        p.vx *= 1 - 0.9 * speed * dt // slows as it goes, so it drifts to a stop
        p.vy *= 1 - 0.9 * speed * dt
      }
    }

    const traceRim = () => {
      ctx.beginPath()
      if (shape === 'circle') {
        ctx.ellipse(box.left + box.w / 2, box.top + box.h / 2, box.w / 2, box.h / 2, 0, 0, Math.PI * 2)
      } else if (ctx.roundRect) {
        ctx.roundRect(box.left, box.top, box.w, box.h, ringRadius)
      } else {
        ctx.rect(box.left, box.top, box.w, box.h)
      }
    }

    const draw = () => {
      ctx.clearRect(0, 0, w, h)

      // The border, lit only near each spark. The path is the card's full rim
      // every time, but the stroke is painted with a radial gradient centred on
      // the spark, so everything beyond its reach is drawn at zero alpha and
      // stays invisible. That is what confines the light to one stretch of the
      // edge instead of outlining the whole card.
      // `lighter` so two sparks on the same edge add up rather than overwrite.
      if (box.w > 0 && box.h > 0) {
        ctx.globalCompositeOperation = 'lighter'
        ctx.lineWidth = BORDER_WIDTH

        for (const f of flashes) {
          const k = (1 - f.age / f.life) * glow
          const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r)
          g.addColorStop(0, `rgba(${cr_}, ${cg_}, ${cb_}, ${0.95 * k})`)
          g.addColorStop(0.5, `rgba(${cr_}, ${cg_}, ${cb_}, ${0.35 * k})`)
          g.addColorStop(1, `rgba(${cr_}, ${cg_}, ${cb_}, 0)`)
          ctx.strokeStyle = g
          traceRim()
          ctx.stroke()
        }

        ctx.globalCompositeOperation = 'source-over'
      }

      ctx.fillStyle = fill
      for (const p of parts) {
        ctx.globalAlpha = 1 - p.age / p.life
        ctx.fillRect(Math.round(p.x - p.size / 2), Math.round(p.y - p.size / 2), p.size, p.size)
      }
      ctx.globalAlpha = 1
    }

    // 30fps rather than 60. Decorative canvases at 60 collectively saturate the
    // main thread, and none of this motion is fine enough to show the difference.
    const FRAME = 1000 / 30

    const loop = (now) => {
      raf = requestAnimationFrame(loop)
      const elapsed = now - last
      if (elapsed < FRAME) return
      last = now
      const dt = Math.min(0.05, elapsed / 1000)
      step(dt)
      draw()
    }

    resize()
    measureCard()
    last = performance.now()
    raf = requestAnimationFrame(loop)

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !raf) {
          last = performance.now()
          raf = requestAnimationFrame(loop)
        } else if (!entry.isIntersecting && raf) {
          cancelAnimationFrame(raf)
          raf = 0
        }
      },
      { rootMargin: '80px' },
    )
    io.observe(canvas)

    const ro = new ResizeObserver(() => {
      resize()
      measureCard()
    })
    ro.observe(canvas)
    if (canvas.nextElementSibling) ro.observe(canvas.nextElementSibling)

    // A backgrounded tab still fires rAF in some browsers; stop outright.
    const onVis = () => {
      if (document.hidden && raf) {
        cancelAnimationFrame(raf)
        raf = 0
      } else if (!document.hidden && !raf) {
        last = performance.now()
        raf = requestAnimationFrame(loop)
      }
    }
    document.addEventListener('visibilitychange', onVis)

    return () => {
      if (raf) cancelAnimationFrame(raf)
      io.disconnect()
      ro.disconnect()
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [color, shape, radius, pad, rate, inflate, speed, glow])

  // pad is handed to CSS as a custom property, not applied as `inset`. A canvas
  // is a REPLACED element: with `inset` set and width/height auto it does not
  // stretch to the offsets, it falls back to its intrinsic size, which the
  // resize loop had already reduced to zero. The stylesheet turns this into
  // explicit width/height instead.
  return (
    <canvas
      ref={canvasRef}
      className={[styles.embers, className].filter(Boolean).join(' ')}
      style={{ '--ember-pad': `${pad}px` }}
      aria-hidden="true"
    />
  )
}
