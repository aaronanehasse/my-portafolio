import { useEffect, useRef } from 'react'

/**
 * Slow blurple-to-pink blobs behind Lumen's dotted hero, merging like liquid.
 * Colours are Discord's family: blurple, its lighter tints, a purple and fuchsia.
 *
 * They're metaballs: every pixel adds up how close it is to each blob, and
 * the shape is wherever that sum crosses a threshold, so two blobs drifting
 * near each other swell towards one another and fuse, then pull apart. The
 * field is worked out on a small canvas (one pixel per 8 on screen) and
 * scaled up smoothly, which is cheap and gives soft edges for free.
 *
 * Fills its positioned parent; style it (opacity, blur, mask) via className.
 */

const SCALE = 8 // screen px per field px
const FRAME = 1000 / 30

// Each blob: resting place (0–1), how far and how fast it wanders, size, colour
const BLOBS = [
  { x: 0.18, y: 0.3, ax: 0.14, ay: 0.12, fx: 0.07, fy: 0.05, r: 0.13, color: [88, 101, 242] },
  { x: 0.8, y: 0.24, ax: 0.12, ay: 0.14, fx: 0.05, fy: 0.08, r: 0.12, color: [235, 69, 158] },
  { x: 0.5, y: 0.5, ax: 0.24, ay: 0.1, fx: 0.04, fy: 0.06, r: 0.14, color: [121, 132, 245] },
  { x: 0.3, y: 0.74, ax: 0.18, ay: 0.08, fx: 0.06, fy: 0.045, r: 0.11, color: [196, 86, 221] },
  { x: 0.72, y: 0.7, ax: 0.15, ay: 0.12, fx: 0.055, fy: 0.07, r: 0.12, color: [148, 156, 247] },
]

const smooth = (a, b, v) => {
  const k = Math.min(1, Math.max(0, (v - a) / (b - a)))
  return k * k * (3 - 2 * k)
}

export default function LumenBlobs({ className }) {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    if (!ctx) return undefined
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let w = 0
    let h = 0
    let img = null
    let clock = 0

    const resize = () => {
      w = Math.max(1, Math.ceil(canvas.clientWidth / SCALE))
      h = Math.max(1, Math.ceil(canvas.clientHeight / SCALE))
      canvas.width = w
      canvas.height = h
      img = ctx.createImageData(w, h)
    }

    const draw = (t) => {
      // Where each blob is now, in field pixels
      const unit = Math.min(w, h * 1.6)
      const now = BLOBS.map((b, i) => ({
        x: (b.x + b.ax * Math.sin(t * b.fx * Math.PI * 2 + i)) * w,
        y: (b.y + b.ay * Math.cos(t * b.fy * Math.PI * 2 + i * 1.7)) * h,
        r2: (b.r * unit * (1 + 0.08 * Math.sin(t * 0.3 + i))) ** 2,
        color: b.color,
      }))

      const px = img.data
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          let field = 0
          let cr = 0
          let cg = 0
          let cb = 0
          for (const b of now) {
            const dx = x - b.x
            const dy = y - b.y
            const f = b.r2 / (dx * dx + dy * dy + 1)
            field += f
            cr += b.color[0] * f
            cg += b.color[1] * f
            cb += b.color[2] * f
          }
          const i = (y * w + x) * 4
          // Soft threshold: the liquid edge
          const a = smooth(0.7, 1.4, field)
          px[i] = cr / field
          px[i + 1] = cg / field
          px[i + 2] = cb / field
          px[i + 3] = a * 255
        }
      }
      ctx.putImageData(img, 0, 0)
    }

    resize()
    draw(0)
    const ro = new ResizeObserver(() => {
      resize()
      draw(clock)
    })
    ro.observe(canvas)
    if (reduced) return () => ro.disconnect()

    let raf = 0
    let last = 0
    const loop = (now) => {
      raf = requestAnimationFrame(loop)
      if (now - last < FRAME - 1) return
      clock += Math.min(0.1, (now - last) / 1000)
      last = now
      draw(clock)
    }
    const play = () => {
      if (raf) return
      last = performance.now()
      raf = requestAnimationFrame(loop)
    }
    const pause = () => {
      cancelAnimationFrame(raf)
      raf = 0
    }
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? play() : pause()))
    io.observe(canvas)
    const onVis = () => (document.hidden ? pause() : play())
    document.addEventListener('visibilitychange', onVis)

    return () => {
      pause()
      io.disconnect()
      ro.disconnect()
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [])

  return <canvas ref={ref} className={className} aria-hidden="true" />
}
