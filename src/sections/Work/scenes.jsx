import { useId } from 'react'
import { Check, DollarSign, Plus, ShoppingCart } from 'lucide-react'
import {
  actionAt,
  bell,
  clamp01,
  easeInBack,
  easeInOutCubic,
  easeOutBack,
  easeOutCubic,
  lerp,
  loopLength,
  seg,
  track,
  useTimeline,
} from '../../lib/motion.js'
import s from './scenes.module.css'

/*
 * Motion-graphics product scenes for the Work section. Same grammar as the
 * philosophy illustrations: an intro that plays once, then a loop of actions,
 * each starting and ending in the settled state. Surfaces from the page ladder,
 * the accent as the only colour, no gradients.
 *
 * These are illustrations of each product, not screenshots — swap in a real
 * recording later by replacing the scene with a <video> in the same stage.
 */

const Ripple = ({ x, y, k, r = 16 }) =>
  k > 0 && k < 1 ? (
    <circle className={s.ripple} cx={x} cy={y} r={4 + r * easeOutCubic(k)} opacity={(1 - k) * 0.9} />
  ) : null

const Cursor = ({ x, y, press = 0, opacity = 1 }) =>
  opacity > 0.01 ? (
    <g transform={`translate(${x} ${y}) scale(${1 - press * 0.18})`} opacity={opacity}>
      <path className={s.cursor} d="M0 0l14 7.5-6.2 1.6L4.8 15.4z" />
    </g>
  ) : null

/** A fixed set of named click moments → the squash on the cursor. */
const pressAt = (u, times) => Math.max(0, ...times.map((c) => bell(u, c, 0.09)))

/* ================================================================== */
/* Lode Studio — desktop app: a voxel build assembling itself              */
/* ================================================================== */

const LODE_INTRO = 3.2
const LODE_ACTIONS = [
  { name: 'paint', dur: 3.6 },
  { name: 'spin', dur: 3.0 },
  { name: 'explode', dur: 2.6 },
  { name: 'export', dur: 3.2 },
]
const LODE_LOOP = loopLength(LODE_ACTIONS)

// Isometric projection around the middle of the canvas
const ISO_O = [238, 186]
const IX = 22
const IY = 12.5
const IZ = 25
const project = (gx, gy, gz) => [ISO_O[0] + (gx - gy) * IX, ISO_O[1] + (gx + gy) * IY - gz * IZ]

// A small pyramid: 3×3, then 2×2, then one ore block on top. Centred on (0, 0).
const BLOCKS = [
  ...[-1, 0, 1].flatMap((y) => [-1, 0, 1].map((x) => ({ x, y, z: 0 }))),
  ...[-0.5, 0.5].flatMap((y) => [-0.5, 0.5].map((x) => ({ x, y, z: 1 }))),
  { x: 0, y: 0, z: 2, ore: true },
]
  .map((b) => ({ ...b, dist: Math.hypot(b.x, b.y, b.z - 2) }))
  .sort((a, b) => a.z - b.z || a.x + a.y - (b.x + b.y))
  .map((b, i) => ({ ...b, order: i }))

const SIDE_NORMALS = [
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0],
]
const SQUARE = [
  [-1, -1],
  [1, -1],
  [1, 1],
  [-1, 1],
]

/** Polygons for one cube at grid centre (cx, cy), bottom at z, turned by theta. */
function cube(cx, cy, z, theta) {
  const c = Math.cos(theta)
  const sn = Math.sin(theta)
  const rot = ([dx, dy]) => [dx * c - dy * sn, dx * sn + dy * c]
  const base = SQUARE.map((p) => {
    const [rx, ry] = rot(p)
    return [cx + rx * 0.5, cy + ry * 0.5]
  })
  const faces = []
  SIDE_NORMALS.forEach((nrm, k) => {
    const [nx, ny] = rot(nrm)
    if (nx + ny <= 0.001) return // faces away from the viewer
    const a = base[k]
    const b = base[(k + 1) % 4]
    const pts = [project(a[0], a[1], z), project(b[0], b[1], z), project(b[0], b[1], z + 1), project(a[0], a[1], z + 1)]
    // Light from the right: +x faces bright, +y faces dark
    faces.push({ pts, shade: 0.16 + 0.34 * clamp01((ny - nx + 1.2) / 2.4) })
  })
  faces.push({ pts: base.map(([x, y]) => project(x, y, z + 1)), shade: 0 })
  return faces
}

const poly = (pts) => pts.map((p) => p.join(',')).join(' ')

const LODE_REST = [344, 292]
const SWATCHES = [
  { x: 388, fill: '#3b3f43' },
  { x: 410, fill: 'var(--accent)' },
  { x: 432, fill: '#26292c' },
  { x: 454, fill: 'rgba(255,255,255,0.55)' },
]
const SWATCH_Y = 142
const EXPORT_BTN = { x: 384, y: 262, w: 84, h: 26 }

function lodeState(t) {
  const st = { theta: 0, spread: 0, paint: () => 0, swatch: 0, cursor: LODE_REST, cursorIn: 1, press: 0, ripple: null, progress: 0, done: 0, btnPress: 0 }
  if (t < LODE_INTRO) {
    st.cursorIn = seg(t, 2.9, 3.2)
    return st
  }
  const [name, u] = actionAt(t - LODE_INTRO, LODE_ACTIONS)
  const swatchPos = (i) => [SWATCHES[i].x + 8, SWATCH_Y + 10]

  if (name === 'paint') {
    // Pick the accent swatch, paint outward from the top, then pick stone again
    st.cursor = track(u, [
      [0.05, ...LODE_REST],
      [0.5, ...swatchPos(1)],
      [1.7, ...swatchPos(1)],
      [2.1, ...swatchPos(0)],
      [2.3, ...swatchPos(0)],
      [2.9, ...LODE_REST],
    ])
    st.press = pressAt(u, [0.55, 2.15])
    st.swatch = u < 0.55 ? 0 : u < 2.15 ? 1 : 0
    st.paint = (b) =>
      Math.min(
        easeOutCubic(seg(u, 0.7 + b.dist * 0.14, 1.0 + b.dist * 0.14)),
        1 - easeOutCubic(seg(u, 2.3 + b.dist * 0.14, 2.6 + b.dist * 0.14)),
      )
    if (u > 0.55 && u < 1.1) st.ripple = { at: swatchPos(1), k: seg(u, 0.55, 1.05) }
    if (u > 2.15 && u < 2.7) st.ripple = { at: swatchPos(0), k: seg(u, 2.15, 2.65) }
  }

  if (name === 'spin') {
    // Drag across the canvas to orbit the build a full turn
    const drag = easeInOutCubic(seg(u, 0.6, 2.3))
    st.theta = Math.PI * 2 * drag
    st.cursor =
      u < 0.6
        ? track(u, [[0.05, ...LODE_REST], [0.55, 170, 262]])
        : u < 2.35
          ? [lerp(170, 306, drag), 262 - Math.sin(Math.PI * drag) * 10]
          : track(u, [[2.35, 306, 262], [2.9, ...LODE_REST]])
    st.press = pressAt(u, [0.58]) + (u > 0.6 && u < 2.3 ? 0.5 : 0)
  }

  if (name === 'explode') {
    // Exploded view: every block steps out from the centre, then snaps home
    st.spread = easeOutCubic(seg(u, 0.25, 0.8)) * (1 - easeOutBack(seg(u, 1.45, 2.1), 2.2))
  }

  if (name === 'export') {
    const btn = [EXPORT_BTN.x + EXPORT_BTN.w / 2, EXPORT_BTN.y + EXPORT_BTN.h / 2]
    st.cursor = track(u, [[0.05, ...LODE_REST], [0.5, ...btn], [0.9, ...btn], [1.5, ...LODE_REST]])
    st.press = pressAt(u, [0.55])
    st.btnPress = bell(u, 0.58, 0.1)
    st.progress = easeInOutCubic(seg(u, 0.7, 1.8)) * (1 - seg(u, 2.6, 2.9))
    st.done = easeOutBack(seg(u, 1.8, 2.1), 2.2) * (1 - easeInBack(seg(u, 2.6, 2.9)))
    if (u > 0.55 && u < 1.1) st.ripple = { at: btn, k: seg(u, 0.55, 1.05) }
  }

  return st
}

export function LodeScene() {
  const [ref, t] = useTimeline({ intro: LODE_INTRO, loop: LODE_LOOP, still: LODE_INTRO + 3.6 + 3.0 + 2.6 + 2.2 })
  const dots = useId()
  const st = lodeState(t)

  const chrome = easeOutCubic(seg(t, 0, 0.35))
  const rowIn = (i, from) => easeOutBack(seg(t, from + i * 0.08, from + i * 0.08 + 0.4))

  // Position every block (intro drop, spin, explode), then paint back-to-front
  const cubes = BLOCKS.map((b) => {
    const c = Math.cos(st.theta)
    const sn = Math.sin(st.theta)
    let x = b.x * c - b.y * sn
    let y = b.x * sn + b.y * c
    let z = b.z
    const drop = seg(t, 1.0 + b.order * 0.11, 1.45 + b.order * 0.11)
    z += 5 * (1 - easeOutBack(drop, 1.4))
    x += x * st.spread * 0.9
    y += y * st.spread * 0.9
    z += (b.z - 1) * st.spread * 0.8 + st.spread * 0.6
    return { b, x, y, z, visible: drop > 0, opacity: clamp01(drop * 3), paint: b.ore ? 1 : st.paint(b) }
  })
    .filter((c) => c.visible)
    .sort((a, b) => a.x + a.y + a.z - (b.x + b.y + b.z))

  const ring = SWATCHES[st.swatch]

  return (
    <svg ref={ref} className={s.scene} viewBox="0 0 480 320" aria-hidden="true">
      <defs>
        <pattern id={dots} width="14" height="14" patternUnits="userSpaceOnUse">
          <circle cx="7" cy="7" r="0.9" className={s.dot} />
        </pattern>
      </defs>

      <g opacity={chrome}>
        {/* Title bar */}
        <rect className={s.raise1} x="0" y="0" width="480" height="30" />
        {[16, 28, 40].map((cx) => (
          <circle key={cx} className={s.raise3} cx={cx} cy="15" r="4" />
        ))}
        <text className={s.faintText} x="464" y="19" textAnchor="end">
          Lode Studio
        </text>

        {/* Sidebar */}
        <rect className={s.raise1} x="0" y="30" width="92" height="290" />
        <rect className={s.tint} x="8" y="66" width="76" height="22" rx="8" opacity={rowIn(1, 0.2)} />
        {[0, 1, 2, 3, 4].map((i) => (
          <g key={i} opacity={clamp01(rowIn(i, 0.2))}>
            <rect className={i === 1 ? s.accent : s.raise3} x="16" y={46 + i * 26} width="10" height="10" rx="3" />
            <rect className={s.raise2} x="32" y={48 + i * 26} width={44 * clamp01(rowIn(i, 0.25))} height="6" rx="3" />
          </g>
        ))}

        {/* Canvas */}
        <rect className={s.sunken} x="100" y="38" width="276" height="274" rx="14" />
        <rect x="100" y="38" width="276" height="274" rx="14" fill={`url(#${dots})`} />

        {/* Properties panel */}
        <rect className={s.raise1} x="380" y="30" width="100" height="290" />
        <text className={s.label} x="388" y="52">BLOCK</text>
        {[
          ['Type', st.paint(BLOCKS[0]) > 0.5 ? 'Ore' : 'Stone'],
          ['Size', '16 px'],
        ].map(([k, v], i) => (
          <g key={k} opacity={clamp01(rowIn(i, 0.45))}>
            <rect className={s.field} x="388" y={60 + i * 30} width="84" height="22" rx="7" />
            <text className={s.fieldLabel} x="396" y={75 + i * 30}>{k}</text>
            <text className={s.fieldValue} x="464" y={75 + i * 30} textAnchor="end">{v}</text>
          </g>
        ))}
        <text className={s.label} x="388" y="134">COLOR</text>
        {SWATCHES.map((sw, i) => (
          <rect key={i} x={sw.x} y={SWATCH_Y} width="16" height="16" rx="5" style={{ fill: sw.fill }} opacity={clamp01(rowIn(i, 0.6))} />
        ))}
        <text className={s.label} x="388" y="184">LAYERS</text>
        {['Ore', 'Upper', 'Base'].map((layer, i) => (
          <g key={layer} opacity={clamp01(rowIn(i, 0.7))}>
            <rect className={i === 0 ? s.tint : s.raise2} x="388" y={192 + i * 22} width="84" height="18" rx="6" />
            <rect className={i === 0 ? s.accent : s.raise3} x="395" y={198 + i * 22} width="6" height="6" rx="1.5" />
            <text className={s.fieldLabel} x="408" y={204 + i * 22}>{layer}</text>
          </g>
        ))}
        {t >= LODE_INTRO && <rect className={s.swatchRing} x={ring.x - 3} y={SWATCH_Y - 3} width="22" height="22" rx="7" />}

        {/* Export */}
        <g
          transform={`translate(${EXPORT_BTN.x + EXPORT_BTN.w / 2} ${EXPORT_BTN.y + EXPORT_BTN.h / 2}) scale(${(1 - st.btnPress * 0.06) * clamp01(rowIn(0, 0.8))}) translate(${-EXPORT_BTN.w / 2} ${-EXPORT_BTN.h / 2})`}
        >
          <rect className={s.accent} width={EXPORT_BTN.w} height={EXPORT_BTN.h} rx="9" />
          <text className={s.btnText} x={EXPORT_BTN.w / 2} y="17" textAnchor="middle" opacity={1 - clamp01(st.done)}>
            Export
          </text>
          {st.done > 0.01 && (
            <g transform={`translate(${EXPORT_BTN.w / 2} 13) scale(${st.done})`}>
              <Check className={s.check} x={-8} y={-8} size={16} strokeWidth={3} />
            </g>
          )}
        </g>
        <rect className={s.raise2} x={EXPORT_BTN.x} y="298" width={EXPORT_BTN.w} height="4" rx="2" opacity={st.progress > 0 ? 1 : 0} />
        <rect className={s.accent} x={EXPORT_BTN.x} y="298" width={EXPORT_BTN.w * st.progress} height="4" rx="2" />
      </g>

      {/* The build */}
      {cubes.map(({ b, x, y, z, opacity, paint }) =>
        cube(x, y, z, st.theta).map((f, j) => (
          <g key={`${b.order}-${j}`} opacity={opacity}>
            <polygon className={s.stone} points={poly(f.pts)} />
            {paint > 0 && <polygon className={s.accentFace} points={poly(f.pts)} opacity={paint} />}
            {f.shade > 0 && <polygon className={s.shadow} points={poly(f.pts)} opacity={f.shade} />}
          </g>
        )),
      )}

      {st.ripple && <Ripple x={st.ripple.at[0]} y={st.ripple.at[1]} k={st.ripple.k} />}
      <Cursor x={st.cursor[0]} y={st.cursor[1]} press={st.press} opacity={st.cursorIn} />
    </svg>
  )
}

/* ================================================================== */
/* NMCrate — marketplace: browse, filter, buy, sell                   */
/* ================================================================== */

const CRATE_INTRO = 2.2
const CRATE_ACTIONS = [
  { name: 'buy', dur: 3.4 },
  { name: 'filter', dur: 3.6 },
  { name: 'sale', dur: 3.0 },
]
const CRATE_LOOP = loopLength(CRATE_ACTIONS)

const PILLS = ['All', 'Plugins', 'Models', 'Datapacks', 'Tools'].reduce((acc, label) => {
  const x = acc.length ? acc[acc.length - 1].x + acc[acc.length - 1].w + 6 : 16
  return [...acc, { label, x, w: label.length * 6 + 20 }]
}, [])
const PILL_Y = 72

// Demo listings; the icon is just a shape so each thumbnail reads differently
const PRODUCTS = [
  { price: '$4.99', icon: 'cube' },
  { price: 'Free', icon: 'gem', dim: true },
  { price: '$12.00', icon: 'scroll' },
  { price: '$2.40', icon: 'gear' },
  { price: '$34.99', icon: 'cube', dim: true },
  { price: '$9.99', icon: 'gem' },
]
const CARD = { w: 140, h: 100, gap: 14, x0: 16, y0: 96 }
const cardPos = (i) => [CARD.x0 + (i % 3) * (CARD.w + CARD.gap), CARD.y0 + Math.floor(i / 3) * (CARD.h + CARD.gap)]
const FILTER_ORDER = [2, 0, 5, 3, 1, 4] // where each card moves when "Models" is picked
const CART = [446, 48]
const CRATE_REST = [420, 300]

function ProductIcon({ kind, x, y }) {
  if (kind === 'cube')
    return (
      <g transform={`translate(${x} ${y})`}>
        <polygon className={s.raise3} points="0,-12 14,-5 0,2 -14,-5" />
        <polygon className={s.raise2} points="-14,-5 0,2 0,16 -14,9" />
        <polygon className={s.accentSoft} points="14,-5 0,2 0,16 14,9" />
      </g>
    )
  if (kind === 'gem') return <polygon transform={`translate(${x} ${y})`} className={s.accent} points="0,-13 11,-3 0,13 -11,-3" />
  if (kind === 'gear')
    return (
      <g transform={`translate(${x} ${y})`}>
        <circle className={s.raise3} r="11" />
        <circle className={s.sunken} r="4.5" />
      </g>
    )
  return (
    <g transform={`translate(${x - 14} ${y - 11})`}>
      {[0, 8, 16].map((dy, i) => (
        <rect key={dy} className={i === 0 ? s.accent : s.raise3} y={dy} width={i === 2 ? 18 : 28} height="4" rx="2" />
      ))}
    </g>
  )
}

function crateState(t) {
  const st = { cursor: CRATE_REST, cursorIn: 1, press: 0, pill: 0, pillK: 0, slot: (i) => i, shuffle: 0, dim: 0, hover: -1, hoverK: 0, fly: null, badge: 0, cartBump: 0, badgeText: '1', toast: 0, sale: 0, spark: 0, ripple: null }
  if (t < CRATE_INTRO) {
    st.cursorIn = seg(t, 1.9, 2.2)
    return st
  }
  const [name, u] = actionAt(t - CRATE_INTRO, CRATE_ACTIONS)

  if (name === 'buy') {
    // Hover a listing, add it, it flies into the cart, the cart confirms
    const target = 4
    const [cx, cy] = cardPos(target)
    const addBtn = [cx + CARD.w - 18, cy + CARD.h - 16]
    st.cursor = track(u, [[0.05, ...CRATE_REST], [0.55, ...addBtn], [1.05, ...addBtn], [1.6, ...CRATE_REST]])
    st.press = pressAt(u, [0.95])
    st.hover = target
    st.hoverK = easeOutBack(seg(u, 0.4, 0.7), 2) * (1 - easeOutCubic(seg(u, 1.2, 1.5)))
    const fly = seg(u, 1.0, 1.55)
    if (fly > 0 && fly < 1) {
      const k = easeInOutCubic(fly)
      const from = [cx + CARD.w / 2, cy + 36]
      st.fly = { x: lerp(from[0], CART[0], k), y: lerp(from[1], CART[1], k) - Math.sin(Math.PI * k) * 60, scale: 1 - 0.6 * k }
    }
    st.badge = easeOutBack(seg(u, 1.55, 1.8), 2.4) * (1 - easeInBack(seg(u, 2.9, 3.2)))
    st.badgeText = u > 2.35 ? '✓' : '1'
    st.cartBump = bell(u, 1.6, 0.16)
    if (u > 0.95 && u < 1.45) st.ripple = { at: addBtn, k: seg(u, 0.95, 1.45) }
    if (u > 1.55 && u < 2.05) st.ripple = { at: CART, k: seg(u, 1.55, 2.05) }
  }

  if (name === 'filter') {
    // Pick "Models": the highlight slides over, listings regroup; then back to "All"
    const models = [PILLS[2].x + PILLS[2].w / 2, PILL_Y + 10]
    const all = [PILLS[0].x + PILLS[0].w / 2, PILL_Y + 10]
    st.cursor = track(u, [[0.05, ...CRATE_REST], [0.55, ...models], [1.9, ...models], [2.2, ...all], [2.5, ...all], [3.1, ...CRATE_REST]])
    st.press = pressAt(u, [0.6, 2.25])
    const go = easeOutBack(seg(u, 0.62, 1.0), 1.6)
    const back = easeOutBack(seg(u, 2.27, 2.65), 1.6)
    st.pill = 2
    st.pillK = go * (1 - back)
    st.shuffle = easeInOutCubic(seg(u, 0.75, 1.4)) * (1 - easeInOutCubic(seg(u, 2.35, 3.0)))
    st.slot = (i) => FILTER_ORDER[i]
    st.dim = st.shuffle
    if (u > 0.6 && u < 1.1) st.ripple = { at: models, k: seg(u, 0.6, 1.1) }
    if (u > 2.25 && u < 2.75) st.ripple = { at: all, k: seg(u, 2.25, 2.75) }
  }

  if (name === 'sale') {
    st.toast = easeOutBack(seg(u, 0.2, 0.6), 1.6) * (1 - easeInBack(seg(u, 2.3, 2.7)))
    st.sale = easeOutCubic(seg(u, 0.5, 1.1))
    st.spark = easeOutCubic(seg(u, 0.5, 1.3))
  }

  return st
}

export function CrateScene() {
  const [ref, t] = useTimeline({ intro: CRATE_INTRO, loop: CRATE_LOOP, still: CRATE_INTRO + 3.4 + 3.6 + 1.5 })
  const st = crateState(t)

  const chrome = easeOutCubic(seg(t, 0, 0.35))
  const headerIn = easeOutBack(seg(t, 0.25, 0.65), 1.6)
  const pillIn = (i) => easeOutBack(seg(t, 0.5 + i * 0.07, 0.85 + i * 0.07), 2)
  const cardIn = (i) => easeOutBack(seg(t, 0.8 + i * 0.12, 1.25 + i * 0.12), 1.6)

  const from = PILLS[0]
  const to = PILLS[st.pill]
  const hi = { x: lerp(from.x, to.x, st.pillK), w: lerp(from.w, to.w, st.pillK) }

  return (
    <svg ref={ref} className={s.scene} viewBox="0 0 480 320" aria-hidden="true">
      <g opacity={chrome}>
        {/* Browser bar */}
        <rect className={s.raise1} x="0" y="0" width="480" height="28" />
        {[16, 28, 40].map((cx) => (
          <circle key={cx} className={s.raise3} cx={cx} cy="14" r="4" />
        ))}
        <rect className={s.raise2} x="160" y="7" width="160" height="14" rx="7" />
        <text className={s.faintText} x="240" y="17.5" textAnchor="middle">
          nmcrate.net
        </text>
      </g>

      {/* Header: logo placeholder, search, cart */}
      <g opacity={clamp01(headerIn)} transform={`translate(0 ${(1 - headerIn) * 6})`}>
        <image href="/work/nmcrate.png" x="16" y="38" width="20" height="20" />
        <text className={s.brandText} x="44" y="52">NMCrate</text>
        <rect className={s.raise2} x="150" y="38" width="190" height="20" rx="10" />
        <text className={s.faintText} x="164" y="51.5">Search plugins, models…</text>
        <g transform={`translate(${CART[0]} ${CART[1]}) scale(${1 + st.cartBump * 0.18})`}>
          <ShoppingCart className={s.cartIcon} x={-10} y={-10} size={20} strokeWidth={1.75} />
        </g>
        {st.badge > 0.01 && (
          <g transform={`translate(${CART[0] + 10} ${CART[1] - 9}) scale(${st.badge})`}>
            <circle className={s.accent} r="7" />
            {st.badgeText === '✓' ? (
              <Check className={s.badgeCheck} x={-4.5} y={-4.5} size={9} strokeWidth={3.5} />
            ) : (
              <text className={s.badgeText} y="3" textAnchor="middle">{st.badgeText}</text>
            )}
          </g>
        )}
      </g>

      {/* Category pills with a highlight that slides between them */}
      {PILLS.map((p, i) => (
        <rect
          key={p.label}
          className={s.raise1}
          transform={`translate(${p.x + p.w / 2} ${PILL_Y + 10}) scale(${pillIn(i)})`}
          x={-p.w / 2}
          y="-10"
          width={p.w}
          height="20"
          rx="10"
        />
      ))}
      {t >= 0.5 && <rect className={s.tint} x={hi.x} y={PILL_Y} width={hi.w} height="20" rx="10" opacity={clamp01(pillIn(0))} />}
      {PILLS.map((p, i) => (
        <g key={p.label} transform={`translate(${p.x + p.w / 2} ${PILL_Y + 10}) scale(${pillIn(i)})`}>
          <text
            className={(i === 0 && st.pillK < 0.5) || (i === st.pill && st.pillK >= 0.5) ? s.pillActive : s.pillText}
            y="3.5"
            textAnchor="middle"
          >
            {p.label}
          </text>
        </g>
      ))}

      {/* Listings */}
      {PRODUCTS.map((p, i) => ({ p, i }))
        .sort((a, b) => (a.i === st.hover ? 1 : b.i === st.hover ? -1 : 0))
        .map(({ p, i }) => {
          const home = cardPos(i)
          const away = cardPos(st.slot(i))
          const k = st.shuffle
          const arc = Math.sin(Math.PI * k) * 16
          const x = lerp(home[0], away[0], k)
          const y = lerp(home[1], away[1], k) - arc
          const lift = i === st.hover ? st.hoverK : 0
          const scale = cardIn(i) * (1 + lift * 0.04) * (1 + Math.sin(Math.PI * k) * 0.04)
          const opacity = clamp01(cardIn(i) * 2) * (p.dim ? 1 - st.dim * 0.65 : 1)
          return (
            <g
              key={i}
              opacity={opacity}
              transform={`translate(${x + CARD.w / 2} ${y + CARD.h / 2 - lift * 4}) scale(${scale}) translate(${-CARD.w / 2} ${-CARD.h / 2})`}
            >
              <rect className={lift > 0.05 ? s.cardHover : s.card} width={CARD.w} height={CARD.h} rx="14" />
              <rect className={s.raise2} x="8" y="8" width={CARD.w - 16} height="52" rx="8" />
              <ProductIcon kind={p.icon} x={CARD.w / 2} y={34} />
              <rect className={s.raise3} x="10" y="68" width="72" height="6" rx="3" />
              <rect className={s.raise1b} x="10" y="80" width="46" height="5" rx="2.5" />
              <text className={p.price === 'Free' ? s.priceFree : s.price} x={CARD.w - 10} y="86" textAnchor="end">
                {p.price}
              </text>
              {lift > 0.02 && (
                <g transform={`translate(${CARD.w - 18} ${CARD.h - 16}) scale(${lift})`}>
                  <circle className={s.accent} r="9" />
                  <Plus className={s.plus} x={-6} y={-6} size={12} strokeWidth={3} />
                </g>
              )}
            </g>
          )
        })}

      {st.fly && (
        <g transform={`translate(${st.fly.x} ${st.fly.y}) scale(${st.fly.scale})`}>
          <ProductIcon kind="cube" x={0} y={0} />
        </g>
      )}

      {/* Seller's view: a sale comes in */}
      {st.toast > 0.01 && (
        <g transform={`translate(${300 + (1 - st.toast) * 40} 102)`} opacity={clamp01(st.toast)}>
          <rect className={s.toast} width="164" height="66" rx="14" />
          <circle className={s.tint} cx="22" cy="22" r="11" />
          <DollarSign className={s.toastIcon} x={15} y={15} size={14} strokeWidth={2.5} />
          <text className={s.toastTitle} x="40" y="20">New sale</text>
          <text className={s.toastSub} x="40" y="33">Survival Kit</text>
          <text className={s.toastValue} x="152" y="26" textAnchor="end">
            +${(12.99 * st.sale).toFixed(2)}
          </text>
          <path
            className={s.spark}
            d="M14 56 L34 52 L54 54 L74 46 L94 48 L114 40 L134 42 L150 32"
            pathLength="1"
            strokeDasharray="1"
            strokeDashoffset={1 - st.spark}
          />
        </g>
      )}

      {st.ripple && <Ripple x={st.ripple.at[0]} y={st.ripple.at[1]} k={st.ripple.k} />}
      <Cursor x={st.cursor[0]} y={st.cursor[1]} press={st.press} opacity={st.cursorIn} />
    </svg>
  )
}

/* ================================================================== */
/* NDA — a document that writes itself, then gets redacted and stamped */
/* ================================================================== */

const DOC_INTRO = 2.4
const DOC_ACTIONS = [
  { name: 'scan', dur: 2.8 },
  { name: 'stamp', dur: 2.2 },
]
const DOC_LOOP = loopLength(DOC_ACTIONS)

// Deterministic per-card layout so each card looks different but never changes
function docLines(seed) {
  let x = seed * 9301 + 49297
  const rnd = () => {
    x = (x * 9301 + 49297) % 233280
    return x / 233280
  }
  return Array.from({ length: 6 }, (_, i) => {
    const width = i === 0 ? 70 + rnd() * 40 : 110 + rnd() * 90
    const redact = i > 0 && rnd() > 0.35
    const from = 0.2 + rnd() * 0.3
    return { y: 20 + i * 16, width, heading: i === 0, redact, rx: 16 + width * from, rw: width * (0.3 + rnd() * 0.35) }
  })
}

export function RedactedDoc({ seed = 1, delay = 0 }) {
  const [ref, time] = useTimeline({ intro: DOC_INTRO + delay, loop: DOC_LOOP, still: DOC_INTRO + delay + 0.2 })
  const t = time - delay
  const lines = docLines(seed)

  let scan = -1
  let stampLift = 0
  let restamp = 0
  if (time >= DOC_INTRO + delay) {
    const [name, u] = actionAt(time - DOC_INTRO - delay, DOC_ACTIONS)
    if (name === 'scan') scan = easeInOutCubic(seg(u, 0.3, 2.3))
    if (name === 'stamp') {
      // Lifts off the page, hangs, slams back down
      stampLift = bell(u, 0.75, 0.45)
      restamp = seg(u, 1.2, 1.7)
    }
  }
  const scanY = 10 + scan * 100

  const stampIn = easeOutBack(seg(t, 1.8, 2.2), 2.6)

  return (
    <svg ref={ref} className={s.doc} viewBox="0 0 240 120" aria-hidden="true">
      {lines.map((l, i) => {
        const write = easeOutCubic(seg(t, 0.1 + i * 0.12, 0.55 + i * 0.12))
        // Redactions wipe on after the text; the scan line peels each one back as it passes
        let cover = l.redact ? easeOutCubic(seg(t, 1.0 + i * 0.1, 1.35 + i * 0.1)) : 0
        if (l.redact && scan >= 0) cover *= 1 - bell(scanY, l.y + 3, 14) * 0.85
        return (
          <g key={i}>
            <rect className={l.heading ? s.raise3 : s.raise2} x="16" y={l.y} width={l.width * write} height={l.heading ? 8 : 6} rx="3" />
            {cover > 0.01 && <rect className={s.redaction} x={l.rx} y={l.y - 2} width={l.rw * cover} height="10" rx="2" />}
          </g>
        )
      })}

      {scan >= 0 && scan < 1 && (
        <g opacity={bell(scan, 0.5, 0.5)}>
          <rect className={s.scanGlow} x="8" y={scanY - 8} width="224" height="8" />
          <rect className={s.accent} x="8" y={scanY} width="224" height="1.5" />
        </g>
      )}

      {stampIn > 0.01 && (
        <g transform={`translate(196 88) rotate(-12) translate(0 ${-stampLift * 6}) scale(${stampIn * (1 + stampLift * 0.3)})`}>
          <rect className={s.stamp} x="-24" y="-11" width="48" height="22" rx="6" />
          <text className={s.stampText} y="4.5" textAnchor="middle">NDA</text>
        </g>
      )}
      <Ripple x={196} y={88} k={seg(t, 1.95, 2.5)} r={30} />
      <Ripple x={196} y={88} k={restamp} r={30} />
    </svg>
  )
}
