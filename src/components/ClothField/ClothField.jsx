import { useEffect, useRef } from 'react'
import styles from './ClothField.module.css'

/**
 * A grid of dark squares that ripples when something lands on it. Every so
 * often a drop falls at a random spot and a single ring travels outward from
 * it: squares are pushed away from the drop as the ring reaches them, then
 * settle back into place behind it. The ring loses force as it spreads and is
 * gone after `reach` px. Only one ring exists at a time — the next drop waits
 * until the last ring has died out. Squares keep their size; while a ring is
 * moving them they pick up a faint glow. Nothing reacts to the pointer.
 *
 * The ring is described directly (a smooth band at radius speed × age) rather
 * than simulated, so each drop gives exactly one clean ring with no trailing
 * ripples behind it.
 *
 * Optionally, `symbols` (e.g. '$€£¥') form out of the grid now and then: a
 * patch of squares lights up in the glow colour in the shape of a character,
 * dot by dot in a loose order so it seems to generate, holds, then dissolves.
 *
 * Fills its positioned parent by default; pass `className` to place, size or
 * mask it differently (the canvas needs explicit width/height, not just inset).
 *
 * @param {number} [gap]      px between squares at rest
 * @param {number} [size]     px per side
 * @param {string} [color]    hex/rgb, or a custom property name like '--page'
 * @param {number} [every]    average seconds of calm between one ring dying out and the next drop
 * @param {number} [strength] 1 = default push (px a square moves at the ring's start)
 * @param {number} [reach]    px a ring travels before it has faded out completely
 * @param {number} [speed]    px per second the ring travels
 * @param {string} [glow]     colour squares pick up as the ring moves them: hex,
 *        or a custom property name like '--accent'; '' turns the glow off
 * @param {string} [symbols]  characters that occasionally form out of the grid, e.g. '$€£¥'
 * @param {number} [symbolEvery] average seconds between one symbol and the next
 * @param {boolean} [symbolsAvoidCenter] keep symbols to the outer thirds, clear of centred content
 */

const PUSH = 7 // px a square is pushed at full strength
const BAND = 46 // px, width of the ring
const GLOW_FROM = 0.15 // share of the full push a square must move before it glows
const FRAME = 1000 / 60

const GLYPH_COLS = 15 // a symbol is drawn on this many squares across…
const GLYPH_ROWS = 19 // …and this many down
const GLYPH_LIFE = 3.4 // seconds from first dot to last one gone
const GLYPH_IN = 0.9
const GLYPH_OUT = 1.1

const rand = (a, b) => a + Math.random() * (b - a)
const smooth = (k) => k * k * (3 - 2 * k)
const clamp01 = (v) => Math.min(1, Math.max(0, v))

/**
 * Which squares a character covers, and how much of each: draw it large on a
 * scratch canvas and average the ink in every cell. Coverage becomes the dot's
 * opacity, so the shape keeps soft, defined edges instead of a hard stair-step.
 * Each cell also gets a random 0–1 to stagger when it lights up and goes out.
 */
function glyphCells(ch) {
  const S = 12
  const c = document.createElement('canvas')
  c.width = GLYPH_COLS * S
  c.height = GLYPH_ROWS * S
  const g = c.getContext('2d')
  if (!g) return []
  g.fillStyle = '#fff'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.font = `700 ${Math.round(GLYPH_ROWS * S * 0.95)}px system-ui, sans-serif`
  g.fillText(ch, c.width / 2, c.height / 2 + S * 0.4)
  const data = g.getImageData(0, 0, c.width, c.height).data
  const cells = []
  for (let row = 0; row < GLYPH_ROWS; row++) {
    for (let col = 0; col < GLYPH_COLS; col++) {
      let ink = 0
      for (let y = row * S; y < (row + 1) * S; y++) {
        for (let x = col * S; x < (col + 1) * S; x++) ink += data[(y * c.width + x) * 4 + 3]
      }
      const coverage = ink / (S * S * 255)
      if (coverage > 0.12) cells.push([col, row, Math.random(), Math.min(1, coverage * 1.4)])
    }
  }
  return cells
}

export default function ClothField({
  gap = 20,
  size = 4,
  color = 'rgba(0, 0, 0, 0.6)',
  every = 1.5,
  strength = 1,
  reach = 520,
  speed = 240,
  glow = '--accent',
  symbols = '',
  symbolEvery = 3,
  symbolsAvoidCenter = false,
  className,
}) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx) return

    const resolve = (c, fallback) =>
      c.startsWith('--') ? getComputedStyle(canvas).getPropertyValue(c).trim() || fallback : c
    const fill = resolve(color, '#000')
    const glowFill = glow ? resolve(glow, '#2fe57a') : ''
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let w = 0
    let h = 0
    let cols = 0
    let rows = 0
    let ring = null // { x, y, age } — the one ring currently travelling
    let calm = 0.2 // seconds until the next drop
    const masks = Array.from(symbols).map(glyphCells).filter((m) => m.length)
    let glyphs = [] // { cells, col, row, age }
    let nextGlyph = rand(0.8, symbolEvery)

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      cols = Math.ceil(w / gap) + 1
      rows = Math.ceil(h / gap) + 1
    }

    /** How far (px) and in which direction the ring is pushing the square at (px, py). */
    const pushAt = (px, py) => {
      if (!ring) return null
      const dx = px - ring.x
      const dy = py - ring.y
      const d = Math.hypot(dx, dy)
      const radius = ring.age * speed
      const k = (d - radius) / BAND
      if (k < -1.6 || k > 1.2 || d < 0.001) return null
      // Loses force as it spreads, and builds up over the first few px so the
      // drop point itself doesn't jump
      const fade = Math.max(0, 1 - radius / reach) ** 1.6 * Math.min(1, radius / 40)
      // A single smooth band: squares ahead of the ring get pushed out, squares
      // it has passed ease back home
      const amount = PUSH * strength * fade * Math.exp(-k * k * 2.2)
      return amount < 0.05 ? null : { ox: (dx / d) * amount, oy: (dy / d) * amount, e: amount / (PUSH * strength) }
    }

    const draw = () => {
      ctx.clearRect(0, 0, w, h)
      const half = size / 2
      const lit = []

      ctx.fillStyle = fill
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const px = x * gap
          const py = y * gap
          const p = pushAt(px, py)
          if (p) {
            ctx.fillRect(px + p.ox - half, py + p.oy - half, size, size)
            if (p.e > GLOW_FROM) lit.push(px + p.ox, py + p.oy, p.e)
          } else {
            ctx.fillRect(px - half, py - half, size, size)
          }
        }
      }

      // Symbols forming out of the grid, riding any ring that passes through
      if (glyphs.length && glowFill) {
        ctx.fillStyle = glowFill
        for (const gl of glyphs) {
          for (const [cx, cy, seed, cover] of gl.cells) {
            const on = clamp01((gl.age - seed * 0.5) / (GLYPH_IN * 0.6))
            const off = clamp01((GLYPH_LIFE - gl.age - seed * 0.35) / GLYPH_OUT)
            const a = smooth(Math.min(on, off))
            if (a <= 0.01) continue
            // A slow band of brightness runs down the symbol while it's up
            const shimmer = 0.72 + 0.28 * Math.sin(gl.age * 3.2 - cy * 0.55)
            const px = (gl.col + cx) * gap
            const py = (gl.row + cy) * gap
            const p = pushAt(px, py)
            // The fullest dots are drawn a touch bigger, so the shape reads solid
            const d = cover > 0.85 ? size + 1.5 : size
            ctx.globalAlpha = a * (0.25 + 0.75 * cover) * shimmer
            ctx.fillRect(px + (p ? p.ox : 0) - d / 2, py + (p ? p.oy : 0) - d / 2, d, d)
          }
        }
        ctx.globalAlpha = 1
      }

      if (!glowFill || !lit.length) return
      // A faint tint on the squares the ring is moving — kept low so the
      // movement, not the colour, carries the effect
      ctx.fillStyle = glowFill
      const halo = size + 4
      for (let i = 0; i < lit.length; i += 3) {
        const e = (lit[i + 2] - GLOW_FROM) / (1 - GLOW_FROM)
        ctx.globalAlpha = e * 0.07
        ctx.fillRect(lit[i] - halo / 2, lit[i + 1] - halo / 2, halo, halo)
        ctx.globalAlpha = e * 0.4
        ctx.fillRect(lit[i] - half, lit[i + 1] - half, size, size)
      }
      ctx.globalAlpha = 1
    }

    resize()
    draw()

    const ro = new ResizeObserver(() => {
      resize()
      draw()
    })
    ro.observe(canvas)
    if (reduced) return () => ro.disconnect()

    let raf = 0
    let last = 0
    const loop = (now) => {
      raf = requestAnimationFrame(loop)
      if (now - last < FRAME - 1) return
      const dt = Math.min(0.1, (now - last) / 1000)
      last = now

      if (ring) {
        ring.age += dt
        // Gone once it has spread past its reach and the band has cleared
        if (ring.age * speed > reach + BAND * 2) {
          ring = null
          calm = rand(every * 0.6, every * 1.4)
        }
      } else {
        calm -= dt
        if (calm <= 0) ring = { x: rand(0, w), y: rand(0, h), age: 0 }
      }

      if (masks.length) {
        for (const gl of glyphs) gl.age += dt
        glyphs = glyphs.filter((gl) => gl.age < GLYPH_LIFE + 0.5)
        nextGlyph -= dt
        if (nextGlyph <= 0 && glyphs.length < 2) {
          nextGlyph = rand(symbolEvery * 0.6, symbolEvery * 1.4)
          // A free spot: inside the grid, clear of other symbols (and of the
          // middle third, if asked)
          for (let tries = 0; tries < 12; tries++) {
            const col = Math.floor(rand(1, cols - GLYPH_COLS - 1))
            const row = Math.floor(rand(1, rows - GLYPH_ROWS - 1))
            const mid = ((col + GLYPH_COLS / 2) * gap) / w
            if (symbolsAvoidCenter && mid > 0.3 && mid < 0.7) continue
            if (glyphs.some((gl) => Math.abs(gl.col - col) < GLYPH_COLS + 2 && Math.abs(gl.row - row) < GLYPH_ROWS + 2)) continue
            const cells = masks[Math.floor(Math.random() * masks.length)]
            glyphs.push({ cells, col, row, age: 0 })
            break
          }
        }
      }

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
    const onVis = () => (document.hidden ? pause() : play())
    document.addEventListener('visibilitychange', onVis)

    return () => {
      pause()
      io.disconnect()
      ro.disconnect()
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [gap, size, color, every, strength, reach, speed, glow, symbols, symbolEvery, symbolsAvoidCenter])

  return (
    <canvas
      ref={canvasRef}
      className={[styles.field, className].filter(Boolean).join(' ')}
      aria-hidden="true"
    />
  )
}
