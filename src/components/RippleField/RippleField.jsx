import { useEffect, useRef } from 'react'
import styles from './RippleField.module.css'

/**
 * A grid of small squares behind the hero that behaves like the surface of
 * water: every square is tied to its four neighbours, so a nudge in one place
 * travels outward as a ripple. The pointer disturbs it as it moves, and every
 * so often a drop lands somewhere on its own.
 *
 * Squares barely move — a couple of pixels along the slope of the wave — and
 * show the wave mostly through brightness, turning towards the accent as they
 * are disturbed. Not connected by lines.
 *
 * Fills its positioned parent by default; pass `className` to place, size or
 * mask it differently (the canvas needs explicit width/height, not just inset).
 *
 * @param {number} [gap]        px between squares
 * @param {number} [size]       px per side at rest
 * @param {string} [color]      disturbed squares: hex, or a custom property name like '--accent'
 * @param {string} [restColor]  squares at rest
 * @param {boolean} [interactive] the pointer leaves a wake of ripples
 * @param {boolean} [drops]     ripples start on their own every so often
 */

const TENSION = 0.2 // how strongly a square follows its neighbours (< 0.25 stays stable)
const DAMPING = 0.975 // energy kept per step; lower dies out faster
const RETURN = 0.003 // pull back to flat, so the field always settles
const DROP_EVERY = [1.2, 2.6] // seconds between ambient drops
const FRAME = 1000 / 30

const rand = (a, b) => a + Math.random() * (b - a)

export default function RippleField({
  gap: GAP = 22,
  size: SIZE = 2,
  color = '--accent',
  restColor = 'rgba(255, 255, 255, 0.09)',
  interactive = true,
  drops = true,
  className,
}) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx) return

    const accent = color.startsWith('--')
      ? getComputedStyle(canvas).getPropertyValue(color).trim() || '#fff'
      : color
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let w = 0
    let h = 0
    let cols = 0
    let rows = 0
    let height = new Float32Array(0) // displacement of each square
    let speed = new Float32Array(0)

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      cols = Math.ceil(w / GAP) + 1
      rows = Math.ceil(h / GAP) + 1
      height = new Float32Array(cols * rows)
      speed = new Float32Array(cols * rows)
    }

    /** Push the surface down around (x, y) in px, fading out over `radius` cells. */
    const splash = (x, y, amount, radius = 2) => {
      const cx = Math.round(x / GAP)
      const cy = Math.round(y / GAP)
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const gx = cx + dx
          const gy = cy + dy
          if (gx < 1 || gy < 1 || gx >= cols - 1 || gy >= rows - 1) continue
          const d = Math.hypot(dx, dy) / (radius + 1)
          if (d < 1) height[gy * cols + gx] += amount * (1 - d) * (1 - d)
        }
      }
    }

    const step = () => {
      // Each square accelerates towards the average of its neighbours
      for (let y = 1; y < rows - 1; y++) {
        for (let x = 1; x < cols - 1; x++) {
          const i = y * cols + x
          const pull = height[i - 1] + height[i + 1] + height[i - cols] + height[i + cols] - 4 * height[i]
          speed[i] = (speed[i] + pull * TENSION - height[i] * RETURN) * DAMPING
        }
      }
      for (let i = 0; i < height.length; i++) height[i] += speed[i]
    }

    const draw = () => {
      ctx.clearRect(0, 0, w, h)

      // Resting squares in one batch: faint white
      ctx.fillStyle = restColor
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          if (Math.abs(height[y * cols + x]) < 0.06) ctx.fillRect(x * GAP, y * GAP, SIZE, SIZE)
        }
      }

      // Disturbed squares: brighter, a touch bigger, nudged along the slope
      ctx.fillStyle = accent
      for (let y = 1; y < rows - 1; y++) {
        for (let x = 1; x < cols - 1; x++) {
          const i = y * cols + x
          const e = Math.abs(height[i])
          if (e < 0.06) continue
          const ox = Math.max(-3, Math.min(3, (height[i + 1] - height[i - 1]) * 4))
          const oy = Math.max(-3, Math.min(3, (height[i + cols] - height[i - cols]) * 4))
          const size = SIZE + Math.min(1.5, e * 1.2)
          ctx.globalAlpha = Math.min(0.75, 0.12 + e * 0.5)
          ctx.fillRect(x * GAP + ox - (size - SIZE) / 2, y * GAP + oy - (size - SIZE) / 2, size, size)
        }
      }
      ctx.globalAlpha = 1
    }

    resize()
    draw()
    if (reduced) {
      const ro = new ResizeObserver(() => {
        resize()
        draw()
      })
      ro.observe(canvas)
      return () => ro.disconnect()
    }

    // The pointer drags a wake behind it, stronger the faster it moves
    let pointer = null
    let lastPointer = null
    const onPointer = (e) => {
      const r = canvas.getBoundingClientRect()
      pointer = { x: e.clientX - r.left, y: e.clientY - r.top }
    }
    if (interactive) window.addEventListener('pointermove', onPointer, { passive: true })

    let raf = 0
    let last = 0
    let nextDrop = rand(...DROP_EVERY)

    const loop = (now) => {
      raf = requestAnimationFrame(loop)
      if (now - last < FRAME) return
      const dt = Math.min(0.1, (now - last) / 1000)
      last = now

      if (pointer) {
        if (lastPointer) {
          const moved = Math.hypot(pointer.x - lastPointer.x, pointer.y - lastPointer.y)
          if (moved > 1) splash(pointer.x, pointer.y, Math.min(1.4, moved * 0.03), 2)
        }
        lastPointer = pointer
      }

      nextDrop -= dt
      if (drops && nextDrop <= 0) {
        splash(rand(0, w), rand(0, h), rand(1.2, 2.2), 2)
        nextDrop = rand(...DROP_EVERY)
      }

      step()
      draw()
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

    const io = new IntersectionObserver(([entry]) => (entry.isIntersecting ? play() : pause()))
    io.observe(canvas)
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    const onVis = () => (document.hidden ? pause() : play())
    document.addEventListener('visibilitychange', onVis)

    return () => {
      pause()
      io.disconnect()
      ro.disconnect()
      window.removeEventListener('pointermove', onPointer)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [GAP, SIZE, color, restColor, interactive, drops])

  return (
    <canvas
      ref={canvasRef}
      className={[styles.field, className].filter(Boolean).join(' ')}
      aria-hidden="true"
    />
  )
}
