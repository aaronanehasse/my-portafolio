import {
  actionAt,
  bell,
  clamp01,
  easeInBack,
  easeInCubic,
  easeInOutCubic,
  easeOutBack,
  easeOutCubic,
  lerp,
  loopLength,
  seg,
  track,
  useTimeline,
  wobble,
} from '../../lib/motion.js'
import s from './illustrations.module.css'

/*
 * Two spot illustrations for the philosophy intro, choreographed like short
 * motion-graphics pieces: an intro that plays once, then a set of actions that
 * loops forever, each starting and ending in the settled state so nothing ever
 * despawns. Drawn with the page's own surfaces (slab, raise steps, accent) —
 * no gradients. Overlaps are separated by a page-coloured cut-out stroke.
 */

const lerpV = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)]
const add = (a, b) => [a[0] + b[0], a[1] + b[1]]

const Ripple = ({ x, y, k, r = 16 }) =>
  k > 0 && k < 1 ? (
    <circle className={s.ripple} cx={x} cy={y} r={4 + r * easeOutCubic(k)} opacity={(1 - k) * 0.9} />
  ) : null

function Cursor({ x, y, press = 0, opacity = 1, kind = 'arrow' }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${1 - press * 0.18})`} opacity={opacity}>
      {kind === 'scrub' ? (
        <path className={s.cursor} d="M-8 0l4.5-4.5v3h7v-3L8 0l-4.5 4.5v-3h-7v3z" />
      ) : (
        <path className={s.cursor} d="M0 0l14 7.5-6.2 1.6L4.8 15.4z" />
      )}
    </g>
  )
}

/** The little live value that rides next to the cursor while dragging. */
function Readout({ x, y, text }) {
  const w = text.length * 5.4 + 10
  // Flips to the left of the cursor near the right edge, so it never leaves the art
  const left = x + 12 + w > 236 ? x - 6 - w : x + 12
  return (
    <g transform={`translate(${left} ${y + 17})`}>
      <rect className={s.readout} width={w} height="14" rx="4" />
      <text className={s.readoutText} x={w / 2} y="9.8" textAnchor="middle">
        {text}
      </text>
    </g>
  )
}

/* ------------------------------------------------------------------ */
/* 1. Clones: one product, ⌘V, a wall of copies — then it keeps going */
/* ------------------------------------------------------------------ */

const W = 100
const H = 72
const CLONE_INTRO = 2.4
const CLONE_ACTIONS = [
  { name: 'wave', dur: 1.6 },
  { name: 'chart', dur: 3.4 },
  { name: 'shuffle', dur: 2.2 },
  { name: 'flip', dur: 2.0 },
]
const CLONE_LOOP = loopLength(CLONE_ACTIONS)

// 4 × 3 wall of copies; the original lands in slot 5
const SLOTS = Array.from({ length: 12 }, (_, i) => {
  const col = i % 4
  const row = Math.floor(i / 4)
  return { col, row, x: 120 + (col - 1.5) * 52, y: 72 + (row - 1) * 40 }
})
const ORIGIN = { x: 120, y: 72 }
const CELL = 0.42
const ORIGINAL_SLOT = 5
// Copies leave in order of distance, each with its own tilt to settle out of
const FLIGHT = SLOTS.map((slot, i) => ({
  delay: i === ORIGINAL_SLOT ? 0 : 0.05 + (Math.hypot(slot.x - ORIGIN.x, slot.y - ORIGIN.y) / 100) * 0.22,
  tilt: (i % 2 ? 1 : -1) * (10 + ((i * 7) % 12)),
}))

// Chart: the copies restack into bars 1-2-4-5 high, bottom first
const BAR_HEIGHTS = [1, 2, 4, 5]
const BASE_Y = 130
const STEP = 24
const BAR_CELL = 0.3
const CHART = BAR_HEIGHTS.flatMap((h, c) =>
  Array.from({ length: h }, (_, r) => ({ c, r, x: 120 + (c - 1.5) * 52, y: BASE_Y - r * STEP })),
)
const CHART_OF = []
SLOTS.map((_, i) => i)
  .sort((a, b) => SLOTS[a].col - SLOTS[b].col || SLOTS[b].row - SLOTS[a].row)
  .forEach((cell, k) => (CHART_OF[cell] = CHART[k]))
const TREND = BAR_HEIGHTS.map((h, c) => [120 + (c - 1.5) * 52, BASE_Y - (h - 1) * STEP - 22])
const TREND_D = `M${TREND.map((p) => p.join(' ')).join(' L')}`
const TREND_END = TREND[TREND.length - 1]
const TREND_ANGLE =
  (Math.atan2(TREND_END[1] - TREND[2][1], TREND_END[0] - TREND[2][0]) * 180) / Math.PI

// Shuffle: every copy trades places (no fixed points)
const PERM = [7, 2, 11, 4, 9, 0, 10, 5, 3, 8, 1, 6]

function Win({ x, y, scale = 1, sx = 1, rot = 0, opacity = 1, build = 1, flash = 0 }) {
  // Each part of the window lands in turn while `build` runs 0 → 1
  const part = (i) => easeOutBack(seg(build, i * 0.13, i * 0.13 + 0.45))
  const btn = part(4)
  return (
    <g
      transform={`translate(${x} ${y}) rotate(${rot}) scale(${scale * sx} ${scale}) translate(${-W / 2} ${-H / 2})`}
      opacity={opacity}
    >
      <rect className={s.slab} width={W} height={H} rx="12" />
      {sx < 0 ? (
        // The back of the card, seen mid-flip
        <rect className={s.raise2} x={W / 2 - 13} y={H / 2 - 13} width="26" height="26" rx="8" />
      ) : (
        <>
          {[12, 20, 28].map((cx, i) => (
            <circle key={cx} className={s.raise3} cx={cx} cy="12" r={2.5 * part(i * 0.3)} />
          ))}
          <rect className={s.raise2} x="10" y="24" width={50 * part(1)} height="7" rx="3.5" />
          <rect className={s.raise1} x="10" y="37" width={80 * part(2)} height="5" rx="2.5" />
          <rect className={s.raise1} x="10" y="46" width={62 * part(3)} height="5" rx="2.5" />
          <g transform={`translate(26 61.5) scale(${btn}) translate(-16 -5.5)`}>
            <rect className={s.accent} width="32" height="11" rx="5.5" />
            {flash > 0 && <rect className={s.flash} width="32" height="11" rx="5.5" opacity={flash * 0.7} />}
          </g>
        </>
      )}
    </g>
  )
}

/** Where copy i is at time t. `phase` lets trails skip action boundaries. */
function clonePose(i, t) {
  const slot = SLOTS[i]
  const pose = { x: slot.x, y: slot.y, scale: CELL, sx: 1, rot: 0, flash: 0, z: i, out: 1, phase: 'intro' }

  if (t < CLONE_INTRO) {
    const { delay, tilt } = FLIGHT[i]
    const out = seg(t, 1.4 + delay, 1.4 + delay + 0.62)
    const k = easeOutBack(out, 1.2)
    pose.x = lerp(ORIGIN.x, slot.x, k)
    pose.y = lerp(ORIGIN.y, slot.y, k)
    pose.scale = lerp(1, CELL, easeOutCubic(out))
    pose.rot = out > 0 ? tilt * wobble(out * 0.9, 4, 9) * (1 - out) : 0
    pose.out = out
    pose.z = -delay
    return pose
  }

  const [name, u] = actionAt(t - CLONE_INTRO, CLONE_ACTIONS)
  pose.phase = name

  if (name === 'wave') {
    const w = bell(u, 0.35 + (slot.col + slot.row) * 0.1, 0.28)
    pose.scale *= 1 + w * 0.14
    pose.y -= w * 5
    pose.flash = w
  }

  if (name === 'chart') {
    const target = CHART_OF[i]
    const d = target.r * 0.09 + target.c * 0.05
    const go = seg(u, 0.1 + d, 0.7 + d)
    const back = seg(u, 2.45 + (0.6 - d) * 0.4, 2.95 + (0.6 - d) * 0.4)
    const there = lerpV([slot.x, slot.y], [target.x, target.y], easeOutBack(go, 1.3))
    ;[pose.x, pose.y] = lerpV(there, [slot.x, slot.y], easeInOutCubic(back))
    pose.scale = lerp(lerp(CELL, BAR_CELL, easeOutCubic(go)), CELL, easeInOutCubic(back))
    pose.rot = (Math.sin(Math.PI * go) + Math.sin(Math.PI * back)) * (i % 2 ? 7 : -7)
    // Each bar lights up as the trend line passes over it
    pose.flash = bell(u, 1.15 + target.c * 0.15, 0.22)
    pose.z = target.r
  }

  if (name === 'shuffle') {
    const k = easeInOutCubic(seg(u, 0.2 + i * 0.035, 0.95 + i * 0.035))
    const to = SLOTS[PERM[i]]
    const dx = to.x - slot.x
    const dy = to.y - slot.y
    const len = Math.hypot(dx, dy) || 1
    const arc = Math.sin(Math.PI * k)
    // Lifts off an arc so it flies over the others instead of through them
    pose.x = lerp(slot.x, to.x, k) - (dy / len) * arc * 14
    pose.y = lerp(slot.y, to.y, k) + (dx / len) * arc * 14
    pose.scale = CELL * (1 + 0.2 * arc)
    pose.rot = arc * (i % 2 ? 8 : -8)
    pose.z = arc
  }

  if (name === 'flip') {
    const d = slot.col * 0.14 + slot.row * 0.05
    const k = easeInOutCubic(seg(u, 0.15 + d, 0.85 + d))
    pose.sx = Math.cos(Math.PI * 2 * k)
    pose.scale = CELL * (1 + 0.12 * Math.sin(Math.PI * k))
  }

  return pose
}

export function CloneArt({ className }) {
  const [ref, t] = useTimeline({ intro: CLONE_INTRO, loop: CLONE_LOOP, still: CLONE_INTRO + 1.6 + 1.9 })

  // The original assembles itself first
  const intro = easeOutBack(seg(t, 0.1, 0.5))
  const build = seg(t, 0.25, 1.05)

  // ⌘V: anticipation squash, then the press
  const press = bell(t, 1.3, 0.12)
  const keyIn = easeOutBack(seg(t, 0.55, 0.9))

  const copies = SLOTS.map((_, i) => ({ ...clonePose(i, t), i }))
  const landed = copies.filter((c) => c.out > 0.5).length
  const counterIn = easeOutBack(seg(t, 1.45, 1.75))

  // Chart action: the trend line and its arrow
  let trend = 0
  let arrow = 0
  if (t >= CLONE_INTRO) {
    const [name, u] = actionAt(t - CLONE_INTRO, CLONE_ACTIONS)
    if (name === 'chart') {
      trend = easeOutCubic(seg(u, 1.05, 1.75)) * (1 - easeInCubic(seg(u, 2.2, 2.5)))
      arrow = easeOutBack(seg(u, 1.6, 1.9), 2.2) * (1 - easeInBack(seg(u, 2.15, 2.4)))
    }
  }

  const visible = copies.filter((c) => c.out > 0).sort((a, b) => a.z - b.z)

  return (
    <svg ref={ref} className={`${s.art} ${className || ''}`} viewBox="0 0 240 180" aria-hidden="true">
      {/* Motion trails: faint copies a few frames behind anything moving fast */}
      {visible.map((c) => {
        const prev = clonePose(c.i, t - 0.04)
        if (prev.phase !== c.phase || Math.hypot(prev.x - c.x, prev.y - c.y) < 2.2) return null
        return [0.05, 0.1].map((lag, j) => {
          const g = clonePose(c.i, t - lag)
          return g.phase === c.phase ? <Win key={`${c.i}-${j}`} {...g} flash={0} opacity={0.16 - j * 0.07} /> : null
        })
      })}

      {visible.map((c) => (
        <Win key={c.i} x={c.x} y={c.y} scale={c.scale} sx={c.sx} rot={c.rot} flash={c.flash} />
      ))}

      {/* The original, until it becomes one of the copies */}
      {t < CLONE_INTRO && copies[ORIGINAL_SLOT].out === 0 && intro > 0 && (
        <Win x={ORIGIN.x} y={ORIGIN.y} scale={intro} build={build} flash={press} />
      )}

      {trend > 0 && (
        <path className={s.trend} d={TREND_D} pathLength="1" strokeDasharray="1" strokeDashoffset={1 - trend} />
      )}
      {arrow > 0.01 && (
        <g transform={`translate(${TREND_END[0]} ${TREND_END[1]}) rotate(${TREND_ANGLE}) scale(${arrow})`}>
          <path className={s.arrowHead} d="M-7 -6L3 0L-7 6" />
        </g>
      )}

      <Ripple x={104} y={160} k={seg(t, 1.3, 1.9)} r={26} />

      <g
        transform={`translate(104 160) scale(${keyIn}) translate(0 ${press * 2.5}) scale(${1 + press * 0.06} ${1 - press * 0.12})`}
      >
        <rect className={press > 0.3 ? s.keyDown : s.key} x="-20" y="-13" width="40" height="26" rx="8" />
        <text className={s.keyText} y="4.5" textAnchor="middle">
          ⌘V
        </text>
      </g>

      {counterIn > 0.01 && (
        <g transform={`translate(146 160) scale(${counterIn})`}>
          <rect className={s.counter} x="-20" y="-11" width="40" height="22" rx="11" />
          <text className={s.counterText} y="4" textAnchor="middle">
            ×{Math.max(1, landed)}
          </text>
        </g>
      )}
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/* 2. Craft: a curve placed point by point, then endlessly tuned      */
/* ------------------------------------------------------------------ */

const A0 = [48, 128]
const A1 = [118, 74]
const A2 = [192, 100]
const CLICKS = [0.75, 1.15, 1.55]
const DRAG = [1.95, 2.95]
const HANDLE_REST = [40, 0]
const HANDLE_PULL = [64, -22]
const REST = [212, 34]
const BOX = { x: 40, y: 64, w: 160, h: 72 }
const BOX_BR = [BOX.x + BOX.w, BOX.y + BOX.h]
const FIELD = { x: 132, y: 134, w: 76, h: 20 }
const FIELD_VALUE = [FIELD.x + 56, FIELD.y + FIELD.h / 2]

const CRAFT_INTRO = 4.9
const CRAFT_ACTIONS = [
  { name: 'tweak', dur: 2.6 },
  { name: 'stroke', dur: 2.7 },
  { name: 'move', dur: 2.8 },
  { name: 'radius', dur: 2.7 },
  { name: 'scale', dur: 3.2 },
]
const CRAFT_LOOP = loopLength(CRAFT_ACTIONS)

const angleOf = (h) => `∠ ${Math.round((Math.atan2(-h[1], h[0]) * 180) / Math.PI)}°`

function introHandle(t) {
  if (t < DRAG[0]) return [0, 0]
  if (t < DRAG[1]) return lerpV([0, 0], HANDLE_PULL, easeInOutCubic(seg(t, ...DRAG)))
  // Released: springs back past its rest point and wobbles into place
  return lerpV(HANDLE_REST, HANDLE_PULL, wobble(t - DRAG[1]))
}

/**
 * Scrubbing a number field: the cursor grabs the value and drags sideways,
 * the value runs up to `to`, holds, then comes back to `from` with a settle.
 */
function scrub(u, from, to, pxPerUnit, st, label, format) {
  const up = easeInOutCubic(seg(u, 0.7, 1.3))
  const down = easeOutBack(seg(u, 1.55, 2.05), 1.6)
  const v = lerp(lerp(from, to, up), from, down)
  const fieldIn = easeOutBack(seg(u, 0.05, 0.35), 2) * (1 - easeInBack(seg(u, 2.3, 2.6)))
  const grab = [FIELD_VALUE[0], FIELD_VALUE[1] + 2]
  const drag = [grab[0] + (v - from) * pxPerUnit, grab[1]]

  if (u < 0.65) st.cursor = track(u, [[0.1, ...REST], [0.6, ...grab]])
  else if (u < 2.1) st.cursor = drag
  else st.cursor = track(u, [[2.1, ...drag], [2.65, ...REST]])

  const scrubbing = u > 0.62 && u < 2.1
  st.kind = scrubbing ? 'scrub' : 'arrow'
  st.grab = scrubbing ? 'field' : null
  st.press = bell(u, 0.63, 0.08)
  st.field = { label, value: format(v), in: fieldIn, hot: scrubbing }
  return v
}

/** Everything about the craft scene at time t. */
function craftState(t) {
  const st = {
    cardIn: 1,
    cursorIn: 1,
    h: HANDLE_REST,
    smooth: 1,
    a2: A2,
    placed: 3,
    cursor: REST,
    kind: 'arrow',
    press: 0,
    grab: null,
    readout: null,
    marquee: null,
    box: 0,
    k: 1,
    mH: 1,
    mV: 1,
    stroke: 2.5,
    radius: 20,
    field: null,
  }

  if (t < CRAFT_INTRO) {
    st.cardIn = easeOutBack(seg(t, 0, 0.45))
    st.cursorIn = seg(t, 0.3, 0.5)
    st.h = introHandle(t)
    st.smooth = easeInOutCubic(seg(t, ...DRAG))
    st.placed = CLICKS.filter((c) => t >= c).length
    const outH = add(A1, st.h)
    if (t < DRAG[0] - 0.05) {
      st.cursor = track(t, [[0.3, 238, 182], [CLICKS[0], ...A0], [CLICKS[1], ...A1], [CLICKS[2], ...A2], [DRAG[0] - 0.05, ...A1]])
    } else if (t < DRAG[1] + 0.1) {
      st.cursor = outH
    } else {
      st.cursor = track(t, [[DRAG[1] + 0.1, ...outH], [DRAG[1] + 0.7, ...REST]])
    }
    const holding = t > DRAG[0] - 0.05 && t < DRAG[1] + 0.05
    st.grab = holding ? 'handle' : null
    st.press = Math.max(...CLICKS.map((c) => bell(t, c, 0.1)))
    if (holding) st.readout = angleOf(st.h)
    st.mH = easeOutCubic(seg(t, 4.1, 4.45))
    st.mV = easeOutCubic(seg(t, 4.3, 4.65))
    return st
  }

  const [name, u] = actionAt(t - CRAFT_INTRO, CRAFT_ACTIONS)

  if (name === 'tweak') {
    // Grab the handle, swing it somewhere new, let go: it springs home
    const pull = [18, 34]
    const knobRest = add(A1, HANDLE_REST)
    st.h = u < 1.35 ? lerpV(HANDLE_REST, pull, easeInOutCubic(seg(u, 0.65, 1.3))) : lerpV(HANDLE_REST, pull, wobble(u - 1.35))
    const knob = add(A1, st.h)
    if (u < 0.65) st.cursor = track(u, [[0.1, ...REST], [0.6, ...knobRest]])
    else if (u < 1.45) st.cursor = knob
    else st.cursor = track(u, [[1.45, ...knob], [2.1, ...REST]])
    const holding = u > 0.6 && u < 1.35
    st.grab = holding ? 'handle' : null
    st.press = bell(u, 0.62, 0.08)
    if (holding) st.readout = angleOf(st.h)
  }

  if (name === 'stroke') {
    st.stroke = Math.max(1, scrub(u, 2.5, 6, 7, st, 'Stroke', (v) => Math.max(1, v).toFixed(1)))
  }

  if (name === 'move') {
    // Drag the end point up, hold, bring it back with a little settle
    const up = [200, 44]
    if (u < 1.55) st.a2 = lerpV(A2, up, easeInOutCubic(seg(u, 0.65, 1.25)))
    else st.a2 = lerpV(up, A2, easeOutBack(seg(u, 1.55, 2.1)))
    if (u < 0.65) st.cursor = track(u, [[0.1, ...REST], [0.6, ...A2]])
    else if (u < 2.15) st.cursor = st.a2
    else st.cursor = track(u, [[2.15, ...st.a2], [2.75, ...REST]])
    const holding = u > 0.6 && u < 2.1
    st.grab = holding ? 'a2' : null
    st.press = bell(u, 0.62, 0.08)
    if (holding) st.readout = `x ${Math.round(st.a2[0])}  y ${Math.round(st.a2[1])}`
  }

  if (name === 'radius') {
    st.radius = Math.max(4, scrub(u, 20, 44, 1.4, st, 'Radius', (v) => String(Math.round(Math.max(4, v)))))
  }

  if (name === 'scale') {
    // Marquee-select the curve, then pull the corner handle of its bounds
    const m0 = [30, 52]
    const m1 = [208, 146]
    const sweep = easeInOutCubic(seg(u, 0.6, 1.1))
    const cur = lerpV(m0, m1, sweep)
    if (u > 0.6 && u < 1.3) {
      st.marquee = { x: m0[0], y: m0[1], w: cur[0] - m0[0], h: cur[1] - m0[1], o: 1 - seg(u, 1.15, 1.3) }
    }
    st.box = easeOutBack(seg(u, 1.15, 1.4), 2) * (1 - seg(u, 2.75, 3.0))
    st.k = u < 2.05 ? 1 + 0.1 * easeInOutCubic(seg(u, 1.55, 2.0)) : 1 + 0.1 * wobble(u - 2.05)
    const corner = [BOX.x + BOX.w * st.k, BOX.y + BOX.h * st.k]
    if (u < 0.6) st.cursor = track(u, [[0.1, ...REST], [0.55, ...m0]])
    else if (u < 1.15) st.cursor = cur
    else if (u < 1.5) st.cursor = track(u, [[1.15, ...m1], [1.5, ...BOX_BR]])
    else if (u < 2.1) st.cursor = corner
    else st.cursor = track(u, [[2.1, ...corner], [2.8, ...REST]])
    const marqueeing = u > 0.58 && u < 1.1
    const resizing = u > 1.5 && u < 2.05
    st.grab = marqueeing ? 'marquee' : resizing ? 'box' : null
    st.press = bell(u, 0.58, 0.08) + bell(u, 1.52, 0.08)
    if (resizing) st.readout = `${Math.round(st.k * 100)}%`
  }

  return st
}

export function CraftArt({ className }) {
  const [ref, t] = useTimeline({ intro: CRAFT_INTRO, loop: CRAFT_LOOP, still: CRAFT_INTRO + 0.1 })
  const st = craftState(t)

  const [hx, hy] = st.h
  const c0 = [A0[0] + 34 * st.smooth, A0[1]]
  const c2 = [st.a2[0] - 26 * st.smooth, st.a2[1] - 16 * st.smooth]
  const inH = [A1[0] - hx, A1[1] - hy]
  const outH = [A1[0] + hx, A1[1] + hy]

  let d = ''
  if (st.placed >= 2) d = `M${A0} C${c0} ${inH} ${A1}`
  if (st.placed >= 3) d += ` C${outH} ${c2} ${st.a2}`

  // Rubber band from the last anchor to the pen while placing
  const lastAnchor = st.placed === 1 ? A0 : st.placed === 2 ? A1 : null
  const holding = st.grab ? 1 : 0
  const anchors = [A0, A1, st.a2]
  const activeAnchor = st.grab === 'handle' ? 1 : st.grab === 'a2' ? 2 : -1

  return (
    <svg ref={ref} className={`${s.art} ${className || ''}`} viewBox="0 0 240 180" aria-hidden="true">
      <g transform={`translate(120 87) scale(${st.cardIn}) translate(-120 -87)`}>
        <rect className={s.slab} x="20" y="12" width="200" height="150" rx={st.radius} />
      </g>

      {lastAnchor && <line className={s.rubber} x1={lastAnchor[0]} y1={lastAnchor[1]} x2={st.cursor[0]} y2={st.cursor[1]} />}

      <g transform={`translate(${BOX.x} ${BOX.y}) scale(${st.k}) translate(${-BOX.x} ${-BOX.y})`}>
        {d && <path className={s.curve} d={d} style={{ strokeWidth: st.stroke }} />}

        {/* Handles grow out of the middle anchor once it's dragged */}
        {t >= DRAG[0] && (
          <>
            <line className={s.handle} x1={inH[0]} y1={inH[1]} x2={outH[0]} y2={outH[1]} />
            <circle className={s.knob} cx={inH[0]} cy={inH[1]} r="3" />
            <circle className={s.knob} cx={outH[0]} cy={outH[1]} r={st.grab === 'handle' ? 4 : 3} />
          </>
        )}

        {anchors.map((a, i) => {
          const k = easeOutBack(seg(t, CLICKS[i], CLICKS[i] + 0.35), 2.4)
          return k > 0 ? (
            <g key={i} transform={`translate(${a}) scale(${k * (i === activeAnchor ? 1.25 : 1)})`}>
              <rect className={i === activeAnchor ? s.anchorActive : s.anchor} x="-3.5" y="-3.5" width="7" height="7" />
            </g>
          ) : null
        })}

        {st.box > 0.01 && (
          <g opacity={clamp01(st.box)}>
            <rect className={s.bounds} x={BOX.x} y={BOX.y} width={BOX.w} height={BOX.h} />
            {[
              [BOX.x, BOX.y],
              [BOX.x + BOX.w, BOX.y],
              [BOX.x, BOX.y + BOX.h],
              BOX_BR,
            ].map(([x, y]) => (
              <rect key={`${x}-${y}`} className={s.anchor} x={x - 3} y={y - 3} width="6" height="6" />
            ))}
          </g>
        )}
      </g>

      {CLICKS.map((c, i) => (
        <Ripple key={c} x={anchors[i][0]} y={anchors[i][1]} k={seg(t, c, c + 0.5)} />
      ))}

      {/* Redlines: the spacing someone actually measured */}
      {st.mH > 0 && (
        <g>
          <line className={s.redline} x1={34 - 14 * st.mH} y1="148" x2={34 + 14 * st.mH} y2="148" />
          <line className={s.redline} x1="20" y1="144" x2="20" y2="152" opacity={st.mH} />
          <line className={s.redline} x1="48" y1="144" x2="48" y2="152" opacity={st.mH} />
          <g transform={`translate(34 138) scale(${t < CRAFT_INTRO ? easeOutBack(seg(t, 4.3, 4.6), 2.4) : 1})`}>
            <rect className={s.redTag} x="-11" y="-6.5" width="22" height="13" rx="4" />
            <text className={s.redText} y="3" textAnchor="middle">
              28
            </text>
          </g>
        </g>
      )}
      {st.mV > 0 && (
        <g>
          <line className={s.redline} x1="100" y1={43 - 31 * st.mV} x2="100" y2={43 + 31 * st.mV} />
          <line className={s.redline} x1="96" y1="12" x2="104" y2="12" opacity={st.mV} />
          <line className={s.redline} x1="96" y1="74" x2="104" y2="74" opacity={st.mV} />
          <g transform={`translate(86 43) scale(${t < CRAFT_INTRO ? easeOutBack(seg(t, 4.5, 4.8), 2.4) : 1})`}>
            <rect className={s.redTag} x="-11" y="-6.5" width="22" height="13" rx="4" />
            <text className={s.redText} y="3" textAnchor="middle">
              62
            </text>
          </g>
        </g>
      )}

      {/* Number field being scrubbed */}
      {st.field && st.field.in > 0.01 && (
        <g transform={`translate(${FIELD.x + FIELD.w / 2} ${FIELD.y + FIELD.h / 2}) scale(${st.field.in}) translate(${-FIELD.w / 2} ${-FIELD.h / 2})`}>
          <rect className={st.field.hot ? s.fieldHot : s.field} width={FIELD.w} height={FIELD.h} rx="6" />
          <text className={s.fieldLabel} x="8" y="13.2">
            {st.field.label}
          </text>
          <text className={s.fieldValue} x={FIELD.w - 8} y="13.2" textAnchor="end">
            {st.field.value}
          </text>
        </g>
      )}

      {st.marquee && (
        <rect
          className={s.marquee}
          x={st.marquee.x}
          y={st.marquee.y}
          width={Math.max(0, st.marquee.w)}
          height={Math.max(0, st.marquee.h)}
          opacity={st.marquee.o}
        />
      )}

      <Cursor x={st.cursor[0]} y={st.cursor[1]} press={Math.max(st.press, holding * 0.6)} opacity={st.cursorIn} kind={st.kind} />
      {st.readout && <Readout x={st.cursor[0]} y={st.cursor[1]} text={st.readout} />}
    </svg>
  )
}
