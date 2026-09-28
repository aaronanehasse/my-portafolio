import { useId } from 'react'
import { ShoppingCart } from 'lucide-react'
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

/** A line standing in for words. */
const Line = ({ x, y, w, h = 5, fill = 'rgba(255, 255, 255, 0.28)' }) => <rect x={x} y={y} width={w} height={h} rx={h / 2} fill={fill} />

/** A fixed set of named click moments → the squash on the cursor. */
const pressAt = (u, times) => Math.max(0, ...times.map((c) => bell(u, c, 0.09)))

/* ================================================================== */
/* Lode Studio — desktop app: a block built from modules              */
/* ================================================================== */

const LODE_INTRO = 2.4
const LODE_ACTIONS = [
  { name: 'spin', dur: 3.0 },
  { name: 'tune', dur: 2.6 },
  { name: 'add', dur: 4.0 },
  { name: 'remove', dur: 2.2 },
]
const LODE_LOOP = loopLength(LODE_ACTIONS)

const LODE_REST = [440, 300]
const ADD_BTN = { x: 384, y: 60, w: 82, h: 18 }
const VIEWPORT = { x: 56, y: 94, w: 132, h: 116 }
const LIST = { x: 196, y: 132, w: 270 } // the module groups
const GROUP_GAP = 6
const MENU = { x: 318, y: 88, w: 150, h: 222 }
const MENU_CARD = (i) => ({ x: MENU.x + 6, y: MENU.y + 66 + i * 38, w: 138, h: 32 })
const PICKED = 2 // the menu card that gets dragged in: Light Emission
const DROP = [300, 150]
const LEVELS = [0.08, 0.62] // Mining Level: Wood/Gold, then Diamond

// The block preview: its own small isometric projection
const P_O = [122, 164]
const P_X = 23
const P_Y = 13.2
const P_Z = 27
const pproject = (x, y, z) => [P_O[0] + (x - y) * P_X, P_O[1] + (x + y) * P_Y - z * P_Z]
const SIDES = [[0, -1], [1, 0], [0, 1], [-1, 0]] // outward normal of each base edge
const CORNERS = [[-0.5, -0.5], [0.5, -0.5], [0.5, 0.5], [-0.5, 0.5]]
// Ore flecks, in each face's own 0–1 coordinates; the last two catch the light
const FLECKS = [[0.16, 0.2], [0.56, 0.28], [0.3, 0.6], [0.72, 0.66], [0.6, 0.08], [0.1, 0.78]]

/** The unit block's visible faces turned by theta, bottom at z; each can map (u, v) onto itself. */
function blockFaces(theta, z) {
  const c = Math.cos(theta)
  const sn = Math.sin(theta)
  const base = CORNERS.map(([x, y]) => [x * c - y * sn, x * sn + y * c])
  const faces = []
  SIDES.forEach(([nx0, ny0], k) => {
    const nx = nx0 * c - ny0 * sn
    const ny = nx0 * sn + ny0 * c
    if (nx + ny <= 0.001) return // faces away
    const a = base[k]
    const b = base[(k + 1) % 4]
    const at = (u, v) => pproject(lerp(a[0], b[0], u), lerp(a[1], b[1], u), z + 1 - v)
    faces.push({ at, shade: 0.12 + 0.36 * clamp01((ny - nx + 1.2) / 2.4) })
  })
  const [p0, p1, , p3] = base
  const top = (u, v) => pproject(p0[0] + (p1[0] - p0[0]) * u + (p3[0] - p0[0]) * v, p0[1] + (p1[1] - p0[1]) * u + (p3[1] - p0[1]) * v, z + 1)
  faces.push({ at: top, shade: 0 })
  return faces
}

const quad = (at, u, v, w) => [at(u, v), at(u + w, v), at(u + w, v + w), at(u, v + w)]
const poly = (pts) => pts.map((p) => p.join(',')).join(' ')

/** The floor grid under the block, turned with it. */
function floorLines(theta) {
  const c = Math.cos(theta)
  const sn = Math.sin(theta)
  const rot = (x, y) => [x * c - y * sn, x * sn + y * c]
  const lines = []
  for (let i = -2; i <= 2; i++) {
    lines.push([rot(i, -2.5), rot(i, 2.5)], [rot(-2.5, i), rot(2.5, i)])
  }
  return lines.map(([a, b]) => [pproject(a[0], a[1], 0), pproject(b[0], b[1], 0)])
}

/** A small ✕. */
const Cross = ({ x, y, r = 2.6 }) => (
  <path d={`M${x - r} ${y - r}L${x + r} ${y + r}M${x + r} ${y - r}L${x - r} ${y + r}`} stroke="rgba(255, 255, 255, 0.4)" strokeWidth="1.3" strokeLinecap="round" />
)

/** A module group: a header with its colour, then one module inside with a slider or a sound. */
function ModuleGroup({ y, color, title, control, value = 0 }) {
  const item = y + 18
  return (
    <g>
      <rect className={s.panel} x={LIST.x} y={y} width={LIST.w} height="64" rx="6" />
      <rect x={LIST.x + 8} y={y + 6} width="8" height="8" rx="2" fill={color} />
      <Line x={LIST.x + 20} y={y + 7.5} w={title} h={5} fill="rgba(255, 255, 255, 0.85)" />
      <Line x={LIST.x + 24 + title} y={y + 8} w={8} h={4} />
      <Cross x={LIST.x + LIST.w - 12} y={y + 10} />
      <rect className={s.raise1} x={LIST.x + 6} y={item} width={LIST.w - 12} height="40" rx="5" stroke="rgba(255, 255, 255, 0.06)" />
      <rect className={s.raise2} x={LIST.x + 14} y={item + 7} width="14" height="14" rx="3" />
      <Line x={LIST.x + 34} y={item + 11.5} w={52} h={5} fill="rgba(255, 255, 255, 0.75)" />
      <circle cx={LIST.x + 94} cy={item + 14} r="2.6" fill="none" stroke="rgba(255, 255, 255, 0.3)" />
      <Cross x={LIST.x + LIST.w - 18} y={item + 10} r={2.2} />
      {control === 'slider' ? (
        <>
          <rect className={s.raise2} x={LIST.x + 14} y={item + 28} width="120" height="3" rx="1.5" />
          <rect className={s.accent} x={LIST.x + 14} y={item + 28} width={120 * value} height="3" rx="1.5" />
          <rect className={s.accent} x={LIST.x + 14 + 120 * value - 3} y={item + 26.5} width="6" height="6" rx="1.5" />
          <Line x={LIST.x + 144} y={item + 27.5} w={22 + value * 24} h={4} fill="rgba(255, 255, 255, 0.4)" />
        </>
      ) : (
        <>
          <rect className={s.raise2} x={LIST.x + 14} y={item + 24} width="72" height="12" rx="4" />
          <rect className={s.raise3} x={LIST.x + 19} y={item + 27.5} width="5" height="5" rx="1" />
          <Line x={LIST.x + 28} y={item + 28} w={50} h={4} fill="rgba(255, 255, 255, 0.55)" />
        </>
      )}
    </g>
  )
}

/** A card in the Add Module menu. */
function MenuCard({ x, y, w, h, title, dim = 0 }) {
  return (
    <g opacity={1 - dim * 0.6}>
      <rect className={s.panel} x={x} y={y} width={w} height={h} rx="6" />
      <rect className={s.raise3} x={x + 8} y={y + 8} width="8" height="8" rx="2" />
      <Line x={x + 22} y={y + 8} w={title} h={5} fill="rgba(255, 255, 255, 0.8)" />
      <Line x={x + 22} y={y + 18} w={w - 34} h={3.5} />
      <Line x={x + 22} y={y + 24} w={w - 64} h={3.5} />
    </g>
  )
}

const MENU_TITLES = [56, 74, 62, 58]

function lodeState(t, turn) {
  // `turn` alternates each loop, so the slider goes up one time and back down the next
  const [from, to] = turn ? [LEVELS[1], LEVELS[0]] : LEVELS
  const st = { theta: 0, level: from, ins: 0, menu: 0, ghost: null, dim: 0, hint: 0, addPress: 0, cursor: LODE_REST, cursorIn: 1, press: 0, ripple: null }
  if (t < LODE_INTRO) {
    st.cursorIn = seg(t, 2.1, 2.4)
    return st
  }
  const [name, u, index] = actionAt(t - LODE_INTRO, LODE_ACTIONS)
  if (index > 1) st.level = to

  if (name === 'spin') {
    // Drag across the preview to turn the block a full circle; negative so the
    // front face follows the cursor (a positive angle turns it the other way here)
    const drag = easeInOutCubic(seg(u, 0.6, 2.3))
    st.theta = -Math.PI * 2 * drag
    st.cursor =
      u < 0.6
        ? track(u, [[0.05, ...LODE_REST], [0.55, 80, 190]])
        : u < 2.35
          ? [lerp(80, 170, drag), 190 - Math.sin(Math.PI * drag) * 8]
          : track(u, [[2.35, 170, 190], [2.9, ...LODE_REST]])
    st.press = pressAt(u, [0.58]) + (u > 0.6 && u < 2.3 ? 0.5 : 0)
  }

  if (name === 'tune') {
    // Grab the Mining Level knob and slide it
    const y = LIST.y + 18 + 29.5
    const drag = easeInOutCubic(seg(u, 0.75, 1.6))
    st.level = lerp(from, to, drag)
    const knob = LIST.x + 14 + 120 * st.level
    st.cursor =
      u < 0.75
        ? track(u, [[0.05, ...LODE_REST], [0.65, LIST.x + 14 + 120 * from, y]])
        : u < 1.65
          ? [knob, y]
          : track(u, [[1.65, knob, y], [2.3, ...LODE_REST]])
    st.press = pressAt(u, [0.7]) + (u > 0.75 && u < 1.6 ? 0.5 : 0)
  }

  if (name === 'add') {
    // Open the menu, drag Light Emission onto the block, drop it in
    const btn = [ADD_BTN.x + ADD_BTN.w / 2, ADD_BTN.y + ADD_BTN.h / 2]
    const c = MENU_CARD(PICKED)
    const grab = [c.x + c.w / 2, c.y + c.h / 2]
    st.cursor = track(u, [[0.05, ...LODE_REST], [0.45, ...btn], [0.6, ...btn], [1.3, ...grab], [1.45, ...grab], [2.2, ...DROP], [2.3, ...DROP], [3.0, ...LODE_REST]])
    st.press = pressAt(u, [0.52, 1.4]) + (u > 1.45 && u < 2.25 ? 0.5 : 0)
    st.addPress = bell(u, 0.55, 0.1)
    if (u > 0.52 && u < 1.02) st.ripple = { at: btn, k: seg(u, 0.52, 1.02) }
    st.menu = easeOutCubic(seg(u, 0.6, 0.95)) * (1 - easeInCubic(seg(u, 2.4, 2.7)))
    if (u > 1.45 && u < 2.25) {
      st.ghost = st.cursor
      st.dim = 1
      st.hint = seg(u, 1.9, 2.1)
    }
    st.ins = easeOutBack(seg(u, 2.25, 2.65), 1.3)
  }

  if (name === 'remove') {
    // Close the new group: it folds away and the others slide back up
    const close = [LIST.x + LIST.w - 12, LIST.y + 10]
    st.cursor = track(u, [[0.05, ...LODE_REST], [0.6, ...close], [0.8, ...close], [1.5, ...LODE_REST]])
    st.press = pressAt(u, [0.7])
    if (u > 0.7 && u < 1.2) st.ripple = { at: close, k: seg(u, 0.7, 1.2) }
    st.ins = 1 - easeInCubic(seg(u, 0.75, 1.1))
  }

  return st
}

export function LodeScene() {
  const [ref, t, elapsed] = useTimeline({ intro: LODE_INTRO, loop: LODE_LOOP, still: LODE_INTRO + 3.0 + 2.6 + 2.8 })
  const turn = t < LODE_INTRO ? 0 : Math.floor((elapsed - LODE_INTRO) / LODE_LOOP) % 2
  return <LodeArt ref={ref} t={t} turn={turn} />
}

/** The scene at a moment: `t` on the looping timeline, `turn` which way the slider goes this loop. */
export function LodeArt({ ref, t, turn = 0 }) {
  const clip = useId()
  const st = lodeState(t, turn)

  const chrome = easeOutCubic(seg(t, 0, 0.35))
  const pop = (a) => {
    const k = easeOutBack(seg(t, a, a + 0.4), 1.6)
    return { opacity: clamp01(k), transform: `translate(0 ${(1 - k) * 6})` }
  }
  const drop = easeOutBack(seg(t, 0.8, 1.3), 1.4)
  const blockZ = 2.5 * (1 - drop)
  const ins = Math.max(0, st.ins)
  const below = LIST.y + (64 + GROUP_GAP) * ins

  return (
    <svg ref={ref} className={s.scene} viewBox="0 0 480 320" aria-hidden="true">
      <defs>
        <clipPath id={`${clip}-preview`}>
          <rect x={VIEWPORT.x} y={VIEWPORT.y} width={VIEWPORT.w} height={VIEWPORT.h} rx="6" />
        </clipPath>
        <clipPath id={`${clip}-list`}>
          <rect x={LIST.x - 2} y={LIST.y - 2} width={LIST.w + 4} height={310 - LIST.y} />
        </clipPath>
      </defs>

      <g opacity={chrome}>
        {/* Title bar: no bar of its own, it shares the app's background as in the real app.
            Window buttons on the left like the others, the app's name on the right */}
        {[16, 28, 40].map((cx) => (
          <circle key={cx} className={s.raise3} cx={cx} cy="12" r="4" />
        ))}
        <rect className={s.raise2} x="180" y="5" width="120" height="14" rx="4" />
        <Line x={215} y={10} w={50} h={4} />
        <circle cx="409" cy="12" r="4.5" fill="none" stroke="rgba(255, 255, 255, 0.7)" strokeWidth="1.4" />
        <text className={s.faintText} x="464" y="15.5" textAnchor="end">Lode Studio</text>

        {/* Icon rail and the open tab */}
        <rect className={s.tint} x="6" y="30" width="28" height="24" rx="6" />
        <rect className={s.accent} x="15" y="37" width="5" height="5" rx="1" />
        <rect className={s.accent} x="21" y="37" width="5" height="5" rx="1" />
        <rect className={s.accent} x="18" y="43" width="5" height="5" rx="1" />
        {[66, 90, 114, 266, 290].map((y) => (
          <rect key={y} className={s.raise3} x="15" y={y} width="10" height="10" rx="2" />
        ))}
        <rect className={s.raise3} x="48" y="33" width="10" height="10" rx="2" />
        <rect className={s.raise2} x="64" y="30" width="80" height="16" rx="4" />
        <rect className={s.raise3} x="70" y="34" width="8" height="8" rx="1.5" />
        <Line x={84} y={36} w={44} h={4} fill="rgba(255, 255, 255, 0.7)" />

        {/* The editor panel and its header */}
        <rect className={s.panel} x="44" y="52" width="430" height="262" rx="8" />
        <path d="M60 66l-3 3 3 3M72 66l3 3-3 3" fill="none" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="1.3" strokeLinecap="round" />
        <Line x={90} y={67} w={28} h={4} />
        <Line x={124} y={67} w={34} h={4} fill="rgba(255, 255, 255, 0.75)" />
        <Line x={300} y={67} w={28} h={4} />
        <circle cx="340" cy="69" r="3" className={s.raise3} />
        <circle cx="354" cy="69" r="3" className={s.raise3} />
        {[366, 370, 374].map((x) => (
          <circle key={x} cx={x} cy="69" r="1.2" fill="rgba(255, 255, 255, 0.5)" />
        ))}
        <g transform={`translate(${ADD_BTN.x + ADD_BTN.w / 2} ${ADD_BTN.y + ADD_BTN.h / 2}) scale(${1 - st.addPress * 0.06}) translate(${-ADD_BTN.w / 2} ${-ADD_BTN.h / 2})`}>
          <rect className={s.tint} width={ADD_BTN.w} height={ADD_BTN.h} rx="4" stroke="var(--accent)" strokeOpacity="0.6" />
          <rect x="8" y="5.5" width="7" height="7" rx="1.5" fill="none" stroke="var(--accent)" strokeWidth="1.3" />
          <Line x={20} y={7} w={52} h={4} fill="var(--accent)" />
        </g>
        <rect x="44" y="86" width="430" height="1" fill="rgba(255, 255, 255, 0.06)" />
      </g>

      {/* 3D preview: the floor grid and the block, turned together */}
      <g {...pop(0.6)}>
        <rect className={s.sunken} x={VIEWPORT.x} y={VIEWPORT.y} width={VIEWPORT.w} height={VIEWPORT.h} rx="6" />
        <g clipPath={`url(#${clip}-preview)`}>
          {floorLines(st.theta).map(([a, b], i) => (
            <line key={i} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="rgba(255, 255, 255, 0.07)" />
          ))}
          {drop > 0 &&
            blockFaces(st.theta, blockZ).map(({ at, shade }, i) => (
              <g key={i} opacity={clamp01(drop * 3)}>
                <polygon className={s.stoneFace} points={poly(quad(at, 0, 0, 1))} />
                {FLECKS.map(([u, v], j) => (
                  <polygon key={j} points={poly(quad(at, u, v, 0.16))} fill={j > 3 ? '#b8f5a8' : '#3fcf5c'} />
                ))}
                {ins > 0 && FLECKS.map(([u, v], j) => <polygon key={j} points={poly(quad(at, u, v, 0.16))} fill="#fff" opacity={ins * 0.35} />)}
                {shade > 0 && <polygon className={s.shadow} points={poly(quad(at, 0, 0, 1))} opacity={shade} />}
              </g>
            ))}
        </g>
        {[150, 162, 174].map((x) => (
          <rect key={x} className={s.raise3} x={x} y="196" width="8" height="8" rx="2" />
        ))}
      </g>

      {/* Assets */}
      <g {...pop(0.8)}>
        <rect className={s.panel} x="56" y="218" width="132" height="62" rx="6" />
        <rect className={s.raise3} x="64" y="226" width="10" height="8" rx="1.5" />
        <Line x={80} y={228} w={34} h={5} fill="rgba(255, 255, 255, 0.7)" />
        {[244, 262].map((y) => (
          <g key={y}>
            <rect className={s.raise2} x="64" y={y} width="8" height="9" rx="1.5" />
            <Line x={80} y={y + 2.5} w={62} h={4} />
          </g>
        ))}
      </g>

      {/* The block's name */}
      <g {...pop(0.9)}>
        <rect className={s.panel} x={LIST.x} y="94" width={LIST.w} height="30" rx="6" />
        <rect className={s.raise3} x={LIST.x + 10} y="103" width="12" height="12" rx="2" />
        <rect x={LIST.x + 28} y="101" width="1" height="16" fill="rgba(255, 255, 255, 0.1)" />
        <Line x={LIST.x + 34} y={100} w={54} h={6} fill="rgba(255, 255, 255, 0.8)" />
        <Line x={LIST.x + 34} y={111} w={28} h={4} />
      </g>

      {/* Modules: a new one opens up at the top and pushes the rest down */}
      <g clipPath={`url(#${clip}-list)`}>
        {ins > 0.01 && (
          <g opacity={clamp01(ins)} transform={`translate(0 ${LIST.y}) scale(1 ${clamp01(0.6 + ins * 0.4)}) translate(0 ${-LIST.y})`}>
            <ModuleGroup y={LIST.y} color="#e6c34a" title={62} control="slider" value={0.7} />
          </g>
        )}
        <g {...pop(1.0)}>
          <ModuleGroup y={below} color="#8a8f94" title={48} control="slider" value={st.level} />
        </g>
        <g {...pop(1.15)}>
          <ModuleGroup y={below + 64 + GROUP_GAP} color="#5b9be6" title={56} control="sound" />
        </g>
        {st.hint > 0 && <rect className={s.accent} x={LIST.x} y={LIST.y - 4} width={LIST.w} height="2" rx="1" opacity={st.hint} />}
      </g>

      {/* The Add Module menu */}
      {st.menu > 0.01 && (
        <g opacity={st.menu} transform={`translate(${(1 - st.menu) * 24} 0)`}>
          <rect className={s.menu} x={MENU.x} y={MENU.y} width={MENU.w} height={MENU.h} rx="8" />
          <rect className={s.input} x={MENU.x + 6} y={MENU.y + 6} width="96" height="16" rx="4" />
          <circle cx={MENU.x + 15} cy={MENU.y + 14} r="3" fill="none" stroke="rgba(255, 255, 255, 0.35)" strokeWidth="1.2" />
          <Line x={MENU.x + 22} y={MENU.y + 12} w={46} h={4} />
          <rect className={s.input} x={MENU.x + 106} y={MENU.y + 6} width="38" height="16" rx="4" />
          <Line x={MENU.x + 114} y={MENU.y + 12} w={22} h={4} />
          {[[6, 28, 50], [60, 28, 44], [6, 46, 52], [62, 46, 34]].map(([dx, dy, w]) => (
            <g key={`${dx}-${dy}`}>
              <rect className={s.input} x={MENU.x + dx} y={MENU.y + dy} width={w} height="13" rx="6.5" />
              <Line x={MENU.x + dx + 8} y={MENU.y + dy + 4.5} w={w - 16} h={4} fill="rgba(255, 255, 255, 0.45)" />
            </g>
          ))}
          {MENU_TITLES.map((title, i) => (
            <MenuCard key={i} {...MENU_CARD(i)} title={title} dim={i === PICKED ? st.dim : 0} />
          ))}
        </g>
      )}

      {/* The card being dragged */}
      {st.ghost && (
        <g opacity="0.95" transform={`translate(${st.ghost[0]} ${st.ghost[1]}) scale(0.92) rotate(-2)`}>
          <MenuCard x={-MENU_CARD(0).w / 2} y={-16} w={MENU_CARD(0).w} h={32} title={MENU_TITLES[PICKED]} />
        </g>
      )}

      {st.ripple && <Ripple x={st.ripple.at[0]} y={st.ripple.at[1]} k={st.ripple.k} />}
      <Cursor x={st.cursor[0]} y={st.cursor[1]} press={st.press} opacity={st.cursorIn} />
    </svg>
  )
}

/* ================================================================== */
/* NMCrate — marketplace: explore a category, open a product, buy it  */
/* ================================================================== */

const CRATE_INTRO = 2.2
const CRATE_ACTIONS = [
  { name: 'browse', dur: 3.0 },
  { name: 'open', dur: 3.0 },
  { name: 'buy', dur: 3.2 },
  { name: 'back', dur: 2.6 },
]
const CRATE_LOOP = loopLength(CRATE_ACTIONS)

const CRATE_REST = [430, 300]
const CART = [428, 46]
const LOGO = [22, 46]
const NAV_Y = 46
const NAV = [[98, 22], [132, 28], [172, 26], [210, 26]] // each menu item's x and width
const URLS = { home: 'nmcrate.net', models: 'nmcrate.net/category/model', product: 'nmcrate.net/products/nmentities' }

// Listings: the real thumbnails are bright renders, here a colour and a voxel shape each
const LISTINGS = [
  { fill: '#34363a', icon: 'cube' },
  { fill: '#5b4020', icon: 'scroll', price: true },
  { fill: '#34363a', icon: 'gear' },
  { fill: '#76601a', icon: 'gem', price: true },
  { fill: '#5c2019', icon: 'cube', price: true },
]
const GRID = { x: 16, y: 178, w: 104, h: 128, gap: 8 }
const gridPos = (i) => [GRID.x + i * (GRID.w + GRID.gap), GRID.y]
const OPEN = 1 // the listing that gets opened
const ADD = { x: 100, y: 132, w: 168, h: 18 }
const THUMB = { x: 16, y: 74, size: 72 }
// The product's tags, laid out in a row
const TAGS = [22, 34, 30, 28, 22].reduce((acc, w) => [...acc, { x: acc.length ? acc.at(-1).x + acc.at(-1).w + 4 : 100, w }], [])

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

/** Crossfade between pages as k goes 0 → 1: the old one out as the new one comes in, overlapping a little. */
function swap(from, to, k) {
  const view = { home: 0, models: 0, product: 0 }
  view[from] = 1 - clamp01(k * 1.6)
  view[to] = clamp01(k * 1.6 - 0.6)
  return view
}

function crateState(t) {
  const st = {
    cursor: CRATE_REST,
    cursorIn: 1,
    press: 0,
    view: { home: 1, models: 0, product: 0 },
    nav: 0, // the highlighted menu item, sliding between Home (0) and Explore (1)
    navK: 1,
    hoverK: 0,
    fly: null,
    badge: 0,
    cartBump: 0,
    flash: 0,
    ripple: null,
  }
  if (t < CRATE_INTRO) {
    st.cursorIn = seg(t, 1.9, 2.2)
    return st
  }
  const [name, u] = actionAt(t - CRATE_INTRO, CRATE_ACTIONS)
  // Out from the resting spot to a target, click it, and drift back
  const visit = (at) => track(u, [[0.05, ...CRATE_REST], [0.7, ...at], [1.1, ...at], [1.8, ...CRATE_REST]])
  const click = (at, when) => {
    if (u > when && u < when + 0.5) st.ripple = { at, k: seg(u, when, when + 0.5) }
  }

  if (name === 'browse') {
    // Home → Explore: the menu highlight slides over and the category page comes in
    const at = [NAV[1][0] + NAV[1][1] / 2, NAV_Y]
    st.cursor = visit(at)
    st.press = pressAt(u, [0.85])
    click(at, 0.85)
    const k = easeInOutCubic(seg(u, 0.95, 1.45))
    st.view = swap('home', 'models', k)
    st.nav = k
  }

  if (name === 'open') {
    // Hover a listing, lift it, open its page
    const [x, y] = gridPos(OPEN)
    const at = [x + GRID.w / 2, y + 44]
    st.cursor = visit(at)
    st.press = pressAt(u, [0.9])
    click(at, 0.9)
    st.hoverK = easeOutBack(seg(u, 0.45, 0.75), 2) * (1 - seg(u, 1.0, 1.2))
    const k = easeInOutCubic(seg(u, 1.0, 1.5))
    st.view = swap('models', 'product', k)
    st.nav = 1
    st.navK = 1 - k
  }

  if (name === 'buy') {
    // Add to cart: the item flies up into the cart, which counts it
    const at = [ADD.x + ADD.w / 2, ADD.y + ADD.h / 2]
    st.view = { home: 0, models: 0, product: 1 }
    st.nav = 1
    st.navK = 0
    st.cursor = visit(at)
    st.press = pressAt(u, [0.85])
    click(at, 0.85)
    st.flash = bell(u, 1.0, 0.25)
    const fly = seg(u, 0.95, 1.5)
    if (fly > 0 && fly < 1) {
      const k = easeInOutCubic(fly)
      const from = [THUMB.x + THUMB.size / 2, THUMB.y + THUMB.size / 2]
      st.fly = { x: lerp(from[0], CART[0], k), y: lerp(from[1], CART[1], k) - Math.sin(Math.PI * k) * 40, scale: 1 - 0.6 * k }
    }
    st.cartBump = bell(u, 1.55, 0.16)
    st.badge = easeOutBack(seg(u, 1.5, 1.75), 2.4)
    if (u > 1.5 && u < 2.0) st.ripple = { at: CART, k: seg(u, 1.5, 2.0) }
  }

  if (name === 'back') {
    // The logo takes you home; the cart empties out of view as the loop closes
    st.cursor = visit(LOGO)
    st.press = pressAt(u, [0.85])
    click(LOGO, 0.85)
    const k = easeInOutCubic(seg(u, 0.95, 1.45))
    st.view = swap('product', 'home', k)
    st.navK = k
    st.badge = 1 - easeInBack(seg(u, 2.0, 2.4))
  }

  return st
}

/** A listing card, `w` wide, its thumbnail `imgH` tall; `lift` 0–1 for hover. */
function Listing({ item, x, y, w, h, imgH, lift = 0 }) {
  return (
    <g transform={`translate(${x + w / 2} ${y + h / 2 - lift * 4}) scale(${1 + lift * 0.04}) translate(${-w / 2} ${-h / 2})`}>
      <rect className={lift > 0.05 ? s.listingHover : s.listing} width={w} height={h} rx="8" />
      <rect x="4" y="4" width={w - 8} height={imgH} rx="5" fill={item.fill} />
      <ProductIcon kind={item.icon} x={w / 2} y={4 + imgH / 2} />
      {imgH > 50 && (
        <>
          <rect x="8" y={imgH - 10} width="22" height="9" rx="3" fill="rgba(0, 0, 0, 0.6)" />
          <Line x={12} y={imgH - 7.5} w={14} h={4} fill="rgba(255, 255, 255, 0.7)" />
          <Line x={8} y={imgH + 12} w={w * 0.62} h={6} fill="rgba(255, 255, 255, 0.85)" />
          <Line x={8} y={imgH + 23} w={w * 0.45} h={4} />
          {item.price && <Line x={8} y={imgH + 40} w={26} h={6} fill="var(--accent)" />}
          <Line x={w - 22} y={imgH + 41} w={14} h={4} />
        </>
      )}
    </g>
  )
}

export function CrateScene() {
  const [ref, t, clock] = useTimeline({ intro: CRATE_INTRO, loop: CRATE_LOOP, still: CRATE_INTRO + 2.6 })
  return <CrateArt ref={ref} t={t} clock={clock} />
}

/** The scene at a moment: `t` on the looping timeline, `clock` for the mascot's float. */
export function CrateArt({ ref, t, clock }) {
  const st = crateState(t)
  const { view } = st

  const chrome = easeOutCubic(seg(t, 0, 0.35))
  const navIn = easeOutBack(seg(t, 0.25, 0.65), 1.6)
  const pop = (a) => {
    const k = easeOutBack(seg(t, a, a + 0.4), 1.6)
    return { opacity: clamp01(k), transform: `translate(0 ${(1 - k) * 6})` }
  }
  const page = (w) => ({ opacity: w, transform: `translate(0 ${(1 - w) * 6})` })
  const url = URLS[Object.keys(view).reduce((a, b) => (view[b] > view[a] ? b : a))]
  const [hiX, hiW] = [lerp(NAV[0][0], NAV[1][0], st.nav), lerp(NAV[0][1], NAV[1][1], st.nav)]
  const bob = Math.sin(clock * 2.4) * 3

  return (
    <svg ref={ref} className={s.scene} viewBox="0 0 480 320" aria-hidden="true">
      <g opacity={chrome}>
        {/* Browser bar */}
        <rect className={s.raise1} x="0" y="0" width="480" height="28" />
        {[16, 28, 40].map((cx) => (
          <circle key={cx} className={s.raise3} cx={cx} cy="14" r="4" />
        ))}
        <rect className={s.raise2} x="140" y="7" width="200" height="14" rx="7" />
        <text className={s.faintText} x="240" y="17.5" textAnchor="middle">
          {url}
        </text>
      </g>

      {/* Nav: logo, menu with the current page highlighted, search on inner pages, cart and account */}
      <g opacity={clamp01(navIn)} transform={`translate(0 ${(1 - navIn) * 6})`}>
        <polygon
          points={[0, 1, 2, 3, 4, 5].map((i) => `${LOGO[0] + 7 * Math.cos((Math.PI / 3) * i - Math.PI / 2)},${LOGO[1] + 7 * Math.sin((Math.PI / 3) * i - Math.PI / 2)}`).join(' ')}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <Line x={34} y={43} w={46} h={6} fill="var(--accent)" />
        <rect className={s.tint} x={hiX - 6} y="37" width={hiW + 12} height="18" rx="5" opacity={st.navK} />
        {NAV.map(([x, w], i) => (
          <Line key={x} x={x} y={43.5} w={w} fill={i === Math.round(st.nav) && st.navK > 0.5 ? 'var(--accent)' : 'rgba(255, 255, 255, 0.4)'} />
        ))}
        <g opacity={1 - view.home}>
          <rect className={s.input} x="296" y="37" width="112" height="18" rx="4" />
          <circle cx="306" cy="46" r="3.5" fill="none" stroke="rgba(255, 255, 255, 0.35)" strokeWidth="1.3" />
          <Line x={314} y={44} w={70} h={4} fill="rgba(255, 255, 255, 0.18)" />
        </g>
        <g transform={`translate(${CART[0]} ${CART[1]}) scale(${1 + st.cartBump * 0.18})`}>
          <ShoppingCart className={s.cartIcon} x={-8} y={-8} size={16} strokeWidth={1.75} />
        </g>
        {st.badge > 0.01 && (
          <g transform={`translate(${CART[0] + 8} ${CART[1] - 7}) scale(${st.badge})`}>
            <circle className={s.accent} r="6" />
            <text className={s.badgeText} y="2.8" textAnchor="middle">1</text>
          </g>
        )}
        <circle cx="456" cy="46" r="6.5" fill="none" stroke="var(--accent)" strokeWidth="1.6" />
        <rect x="0" y="64" width="480" height="1" fill="rgba(255, 255, 255, 0.06)" opacity={1 - view.home} />
      </g>

      {/* Home: the pitch, the search, the mascot, featured products */}
      {view.home > 0.01 && (
        <g {...page(view.home)}>
          <g {...pop(0.5)}>
            <rect className={s.input} x="210" y="74" width="60" height="14" rx="4" />
            <Line x={220} y={79} w={40} h={4} fill="rgba(255, 255, 255, 0.4)" />
          </g>
          <g {...pop(0.6)}>
            <rect x="130" y="96" width="220" height="18" rx="4" fill="rgba(255, 255, 255, 0.9)" />
          </g>
          <g {...pop(0.7)}>
            <rect x="150" y="119" width="180" height="18" rx="4" className={s.accent} />
            <rect x="150" y="141" width="180" height="2" rx="1" className={s.accent} />
          </g>
          <g {...pop(0.8)}>
            <Line x={110} y={152} w={260} h={4} />
            <Line x={140} y={161} w={200} h={4} />
          </g>
          <g {...pop(0.9)}>
            <rect className={s.input} x="150" y="176" width="180" height="22" rx="5" />
            <circle cx="162" cy="187" r="4" fill="none" stroke="rgba(255, 255, 255, 0.35)" strokeWidth="1.3" />
            <rect className={s.tint} x="290" y="179" width="36" height="16" rx="3" stroke="var(--accent)" />
            <Line x={298} y={185} w={20} h={4} fill="var(--accent)" />
          </g>
          {/* The mascot: a floating voxel figure, just its head and body */}
          <g {...pop(1.0)}>
            <g transform={`translate(0 ${bob})`}>
              <rect x="231" y="206" width="22" height="22" rx="2" className={s.accent} />
              <rect x="247" y="206" width="6" height="22" className={s.accentSoft} />
              <rect x="236" y="213" width="3" height="7" fill="#fff" />
              <rect x="243" y="213" width="3" height="7" fill="#fff" />
              <rect x="235" y="229" width="14" height="14" rx="1" className={s.accentSoft} />
            </g>
          </g>
          <rect x="0" y="252" width="480" height="1" fill="rgba(255, 255, 255, 0.06)" />
          <g {...pop(1.1)}>
            <Line x={16} y={262} w={84} h={8} fill="rgba(255, 255, 255, 0.85)" />
          </g>
          {LISTINGS.map((item, i) => (
            <g key={i} {...pop(1.2 + i * 0.08)}>
              <Listing item={item} x={16 + i * 92} y={278} w={84} h={60} imgH={46} />
            </g>
          ))}
        </g>
      )}

      {/* Explore › Models: the category header, a toolbar and the listings */}
      {view.models > 0.01 && (
        <g {...page(view.models)}>
          <rect className={s.tint} x="228" y="72" width="24" height="24" rx="6" stroke="var(--accent)" />
          <g transform="translate(240 83) scale(0.55)">
            <ProductIcon kind="cube" x={0} y={0} />
          </g>
          <Line x={206} y={103} w={68} h={9} fill="rgba(255, 255, 255, 0.9)" />
          <Line x={165} y={118} w={150} h={4} />
          <rect x="218" y="128" width="44" height="11" rx="5.5" fill="none" stroke="var(--accent)" strokeOpacity="0.6" />
          <Line x={226} y={131.5} w={28} h={4} fill="var(--accent)" />
          <rect className={s.input} x="16" y="148" width="150" height="16" rx="4" />
          <Line x={30} y={154} w={50} h={4} fill="rgba(255, 255, 255, 0.18)" />
          <rect className={s.input} x="360" y="148" width="62" height="16" rx="4" />
          <Line x={368} y={154} w={26} h={4} fill="rgba(255, 255, 255, 0.5)" />
          <rect className={s.input} x="428" y="148" width="36" height="16" rx="4" />
          <rect className={s.tint} x="430" y="150" width="16" height="12" rx="3" />
          <rect x="0" y="170" width="480" height="1" fill="rgba(255, 255, 255, 0.06)" />
          {LISTINGS.slice(0, 4).map((item, i) => {
            const [x, y] = gridPos(i)
            const k = easeOutBack(clamp01(view.models * 1.6 - i * 0.15), 1.4)
            return (
              <g key={i} opacity={clamp01(k)} transform={`translate(0 ${(1 - k) * 10})`}>
                <Listing item={item} x={x} y={y} w={GRID.w} h={GRID.h} imgH={70} lift={i === OPEN ? st.hoverK : 0} />
              </g>
            )
          })}
        </g>
      )}

      {/* The product page */}
      {view.product > 0.01 && (
        <g {...page(view.product)}>
          <rect x={THUMB.x} y={THUMB.y} width={THUMB.size} height={THUMB.size} rx="6" fill="#2f5a22" />
          <ProductIcon kind="cube" x={THUMB.x + THUMB.size / 2} y={THUMB.y + THUMB.size / 2 - 2} />
          {TAGS.map(({ x, w }) => (
            <rect key={x} className={s.raise2} x={x} y="74" width={w} height="9" rx="3" />
          ))}
          <Line x={100} y={90} w={136} h={10} fill="rgba(255, 255, 255, 0.9)" />
          <Line x={100} y={106} w={8} h={4} />
          <Line x={112} y={106} w={40} h={4} fill="var(--accent)" />
          {[0, 1, 2, 3, 4].map((i) => (
            <rect key={i} className={s.raise3} x={100 + i * 8} y="115" width="6" height="6" rx="1" />
          ))}
          <Line x={228} y={110} w={34} h={10} fill="var(--accent)" />
          <Line x={268} y={112} w={22} h={4} />
          <rect x="100" y="126" width="214" height="1" fill="rgba(255, 255, 255, 0.06)" />
          <g
            transform={`translate(${ADD.x + ADD.w / 2} ${ADD.y + ADD.h / 2}) scale(${1 - st.press * 0.04}) translate(${-ADD.w / 2} ${-ADD.h / 2})`}
          >
            <rect className={s.tint} width={ADD.w} height={ADD.h} rx="4" stroke="var(--accent)" strokeOpacity={0.5 + st.flash * 0.5} fillOpacity={0.4 + st.flash * 0.6} />
            <ShoppingCart className={s.addIcon} x={ADD.w / 2 - 26} y={4} size={10} strokeWidth={2} />
            <Line x={ADD.w / 2 - 12} y={7} w={36} h={4} fill="var(--accent)" />
          </g>
          <rect className={s.input} x="274" y="132" width="18" height="18" rx="4" />
          <rect className={s.input} x="296" y="132" width="18" height="18" rx="4" />
          <rect className={s.input} x="100" y="154" width="214" height="18" rx="4" />
          <Line x={188} y={161} w={40} h={4} fill="var(--accent)" />
          <rect className={s.input} x="16" y="184" width="298" height="20" rx="5" />
          <rect className={s.tint} x="19" y="187" width="70" height="14" rx="4" />
          {[36, 110, 180, 250].map((x, i) => (
            <Line key={x} x={x} y={192} w={i ? 30 : 36} h={4} fill={i ? 'rgba(255, 255, 255, 0.35)' : 'var(--accent)'} />
          ))}
          <rect className={s.panel} x="16" y="212" width="298" height="120" rx="6" />
          <Line x={28} y={226} w={130} h={7} fill="rgba(255, 255, 255, 0.85)" />
          <Line x={28} y={244} w={260} h={4} />
          <Line x={28} y={253} w={200} h={4} />
          <rect x="28" y="268" width="274" height="1" fill="rgba(255, 255, 255, 0.08)" />
          <Line x={28} y={282} w={110} h={7} fill="rgba(255, 255, 255, 0.85)" />
          <Line x={28} y={298} w={250} h={4} />
          {/* Side panels: information and recent versions */}
          <rect className={s.panel} x="326" y="74" width="138" height="110" rx="6" />
          <Line x={336} y={84} w={50} h={6} fill="rgba(255, 255, 255, 0.85)" />
          {[102, 120].map((y) => (
            <g key={y}>
              <Line x={336} y={y} w={36} h={4} />
              <Line x={420} y={y} w={34} h={4} fill="rgba(255, 255, 255, 0.7)" />
              <rect x="336" y={y + 10} width="118" height="1" fill="rgba(255, 255, 255, 0.06)" />
            </g>
          ))}
          <Line x={336} y={138} w={34} h={4} />
          {['#d98a2b', '#4a8fe0', '#4cc27a', '#3fb6b0', '#9b6be0'].map((c, i) => (
            <rect key={c} x={336 + (i % 3) * 38} y={148 + Math.floor(i / 3) * 16} width="34" height="12" rx="3" fill="none" stroke={c} strokeOpacity="0.7" />
          ))}
          <rect className={s.panel} x="326" y="192" width="138" height="100" rx="6" />
          <Line x={336} y={202} w={62} h={6} fill="rgba(255, 255, 255, 0.85)" />
          {[220, 244, 268].map((y) => (
            <g key={y}>
              <rect className={s.tint} x="336" y={y} width="30" height="11" rx="3" stroke="var(--accent)" strokeOpacity="0.5" />
              <Line x={372} y={y + 3.5} w={34} h={4} />
            </g>
          ))}
        </g>
      )}

      {st.fly && (
        <g transform={`translate(${st.fly.x} ${st.fly.y}) scale(${st.fly.scale})`}>
          <ProductIcon kind="cube" x={0} y={0} />
        </g>
      )}

      {st.ripple && <Ripple x={st.ripple.at[0]} y={st.ripple.at[1]} k={st.ripple.k} />}
      <Cursor x={st.cursor[0]} y={st.cursor[1]} press={st.press} opacity={st.cursorIn} />
    </svg>
  )
}

/* ================================================================== */
/* Di Young — artist site: a pixel-art hero with parallax, press play  */
/* ================================================================== */

const DY_INTRO = 2.4
const DY_ACTIONS = [
  { name: 'listen', dur: 5.2 },
  { name: 'idle', dur: 1.8 },
]
const DY_LOOP = loopLength(DY_ACTIONS)

// The site's own palette: its blue on near-black; the bunny in its cover colours
const DY = { blue: '#2863b4', light: '#5b8fdc', page: '#0b0b0b', slab: '#171819', text: 'rgba(255, 255, 255, 0.9)' }
const PX = 8 // one pixel of the background art
const GROUND = 292
const TILE = 480 // every parallax layer repeats each canvas width
const DY_REST = [440, 304]
const PREVIEW = { x: 24, y: 214, w: 92, h: 24 }
const COVER = { x: 311, y: 92, size: 128 }
const PLAYER = { x: 120, y: 252, w: 240, h: 56 }

/** A stepped ridge, PX-wide columns under the highest of some peaks, seamless over TILE. */
function ridge(peaks, slope) {
  let d = ''
  for (let x = 0; x < TILE; x += PX) {
    const mid = x + PX / 2
    const h = Math.max(0, ...peaks.flatMap(([at, height]) => [-TILE, 0, TILE].map((o) => height - Math.abs(mid - at - o) * slope)))
    const top = GROUND - Math.round(h / PX) * PX
    if (top < GROUND) d += `M${x} ${top}h${PX}V${GROUND}h${-PX}z`
  }
  return d
}

/** Pixel pines: a trunk and `tiers` steps narrowing to the top. */
const trees = (list) =>
  list
    .map(([cx, tiers]) => {
      let d = `M${cx - 2} ${GROUND - 8}h4v8h-4z`
      for (let i = 0; i < tiers; i++) {
        const w = (tiers - i) * 8 + 4
        d += `M${cx - w / 2} ${GROUND - 16 - i * 8}h${w}v8h${-w}z`
      }
      return d
    })
    .join('')

const FAR = ridge([[60, 150], [230, 116], [380, 160]], 0.9)
const NEAR = ridge([[140, 88], [300, 70], [440, 96]], 1.15)
const TREES = trees([[24, 3], [70, 2], [118, 4], [196, 2], [236, 3], [312, 2], [356, 4], [420, 2]])
// The ground, with tufts along its top edge
const FLOOR = `M0 ${GROUND}h${TILE}V320H0z` + Array.from({ length: TILE / 24 }, (_, i) => `M${i * 24 + (i % 3) * 4} ${GROUND - 4}h4v4h-4z`).join('')

// The Pixel Bunny cover art: K outline, W face, P inner ears, R cheeks
const BUNNY = [
  '..KK....KK..',
  '.KPK....KPK.',
  '.KPK....KPK.',
  '.KPK....KPK.',
  '.KPK....KPK.',
  '.KPKKKKKKPK.',
  'KWWWWWWWWWWK',
  'KWKWWWWWWKWK',
  'KWWWWKKWWWWK',
  'KRWWWWWWWWRK',
  '.KWWWWWWWWK.',
  '..KKKKKKKK..',
]
const BUNNY_FILL = { K: '#0b0b0b', W: '#a6ece4', P: '#e2457e', R: '#f08bb0' }

// The player's waveform: fixed bar heights, loud in the middle like a real track
const WAVE = Array.from({ length: 44 }, (_, i) => {
  const shape = Math.sin((Math.PI * (i + 2)) / 48)
  const grain = (Math.sin(i * 12.9898) * 43758.5453) % 1
  return 3 + Math.round((shape * 0.7 + Math.abs(grain) * 0.3) * 14)
})

/** One layer of the parallax, drawn twice side by side and slid left at `speed` px/s. */
function Layer({ d, speed, clock, opacity }) {
  const x = -((clock * speed) % TILE)
  return (
    <g transform={`translate(${x} 0)`} opacity={opacity} fill={DY.blue}>
      <path d={d} />
      <path d={d} transform={`translate(${TILE} 0)`} />
    </g>
  )
}


function diyoungState(t) {
  const st = { cursor: DY_REST, cursorIn: 1, press: 0, player: 0, progress: 0, ripple: null }
  if (t < DY_INTRO) {
    st.cursorIn = seg(t, 2.1, 2.4)
    return st
  }
  const [name, u] = actionAt(t - DY_INTRO, DY_ACTIONS)

  if (name === 'listen') {
    // Press the preview button: the player rises from the bottom and plays through part of the track
    const at = [PREVIEW.x + PREVIEW.w / 2, PREVIEW.y + PREVIEW.h / 2]
    st.cursor = track(u, [[0.05, ...DY_REST], [0.7, ...at], [1.1, ...at], [1.8, ...DY_REST]])
    st.press = pressAt(u, [0.85])
    st.player = easeOutBack(seg(u, 0.95, 1.4), 1.3) * (1 - easeInBack(seg(u, 4.6, 5.1), 1.3))
    st.progress = seg(u, 1.3, 4.6) * 0.72
    if (u > 0.85 && u < 1.35) st.ripple = { at, k: seg(u, 0.85, 1.35) }
  }

  return st
}

export function DiYoungScene() {
  const [ref, t, clock] = useTimeline({ intro: DY_INTRO, loop: DY_LOOP, still: DY_INTRO + 3.2 })
  return <DiYoungArt ref={ref} t={t} clock={clock} />
}

/** The scene at a moment: `t` on the looping timeline, `clock` for what keeps moving (parallax, the hop). */
export function DiYoungArt({ ref, t, clock }) {
  const st = diyoungState(t)
  const chrome = easeOutCubic(seg(t, 0, 0.35))
  const world = easeOutCubic(seg(t, 0.2, 1.0))
  const grow = (a) => easeOutCubic(seg(t, a, a + 0.45)) // a line writing itself out from the left
  const rise = (a) => {
    const k = easeOutBack(seg(t, a, a + 0.4), 1.4)
    return { opacity: clamp01(k), transform: `translate(0 ${(1 - k) * 8})` }
  }
  const card = easeOutBack(seg(t, 0.9, 1.5), 1.5)

  // The rabbit: a square that hops, stretching in the air and squashing as it lands
  const p = (clock % 0.9) / 0.9
  const air = seg(p, 0.16, 1)
  const hop = Math.round((Math.sin(Math.PI * air) * 26) / 2) * 2
  const squash = p < 0.16 ? Math.sin((Math.PI * p) / 0.16) * 0.3 : 0
  const stretch = air > 0 && air < 0.3 ? 0.12 : 0
  const rw = 14 * (1 + squash - stretch * 0.5)
  const rh = 14 * (1 - squash + stretch)

  const bunnyPx = 6
  const bunnyAt = [COVER.x + (COVER.size - 12 * bunnyPx) / 2, COVER.y + (COVER.size - BUNNY.length * bunnyPx) / 2]

  return (
    <svg ref={ref} className={s.scene} viewBox="0 0 480 320" aria-hidden="true">
      <rect x="0" y="0" width="480" height="320" fill={DY.page} />

      {/* Parallax, back to front, all low opacity so the page stays on top */}
      <g opacity={world} transform={`translate(0 ${(1 - world) * 10})`} shapeRendering="crispEdges">
        <Layer d={FAR} speed={5} clock={clock} opacity={0.1} />
        <Layer d={NEAR} speed={11} clock={clock} opacity={0.16} />
        <Layer d={TREES} speed={20} clock={clock} opacity={0.26} />
        <Layer d={FLOOR} speed={32} clock={clock} opacity={0.34} />
        <rect x={48 - 7 * (1 - hop / 40)} y={GROUND + 3} width={14 * (1 - hop / 40)} height="3" fill="#000" opacity="0.5" />
        <rect x={48 - rw / 2} y={GROUND - rh - hop} width={rw} height={rh} fill="#fff" opacity="0.7" />
      </g>

      <g opacity={chrome}>
        {/* Browser bar */}
        <rect className={s.raise1} x="0" y="0" width="480" height="28" />
        {[16, 28, 40].map((cx) => (
          <circle key={cx} className={s.raise3} cx={cx} cy="14" r="4" />
        ))}
        <rect className={s.raise2} x="160" y="7" width="160" height="14" rx="7" />
        <text className={s.faintText} x="240" y="17.5" textAnchor="middle">
          diyoung.me
        </text>

        {/* The floating nav: artist on the left, menu in the middle, listen on the right */}
        <rect className={s.card} x="12" y="36" width="456" height="26" rx="8" />
        <circle className={s.raise3} cx="27" cy="49" r="7" />
        <Line x={39} y={46.5} w={36} fill={DY.text} />
        <rect className={s.raise2} x="194" y="41" width="34" height="16" rx="5" />
        <Line x={202} y={46.5} w={18} fill={DY.text} />
        <Line x={236} y={46.5} w={26} />
        <Line x={270} y={46.5} w={20} />
        <Line x={384} y={46.5} w={16} />
        <rect x="408" y="41" width="52" height="16" rx="5" fill={DY.blue} />
        <Line x={420} y={46.5} w={28} fill="rgba(255, 255, 255, 0.85)" />
      </g>

      {/* Hero: a big title, one line white and the next blue, then the byline, the pitch and two buttons */}
      <rect x="24" y="82" width={112 * grow(0.45)} height="30" rx="4" fill={DY.text} />
      <rect x="24" y="120" width={150 * grow(0.6)} height="30" rx="4" fill={DY.blue} />
      <Line x={24} y={162} w={52 * grow(0.75)} h={6} fill={DY.light} />
      <Line x={24} y={178} w={150 * grow(0.85)} />
      <Line x={24} y={189} w={108 * grow(0.9)} />
      <g {...rise(1.0)}>
        <g transform={`translate(${PREVIEW.x + PREVIEW.w / 2} ${PREVIEW.y + PREVIEW.h / 2}) scale(${1 - st.press * 0.06})`}>
          <rect x={-PREVIEW.w / 2} y={-PREVIEW.h / 2} width={PREVIEW.w} height={PREVIEW.h} rx="5" fill={DY.blue} />
          <path d="M-34 -5l8 5-8 5z" fill="#fff" />
          <Line x={-20} y={-2.5} w={54} fill="rgba(255, 255, 255, 0.85)" />
        </g>
        <rect className={s.raise1} x="122" y={PREVIEW.y} width="76" height={PREVIEW.h} rx="5" stroke="rgba(255, 255, 255, 0.1)" />
        <circle cx="136" cy={PREVIEW.y + 12} r="4.5" fill="none" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="1.5" />
        <Line x={146} y={PREVIEW.y + 9.5} w={42} fill="rgba(255, 255, 255, 0.5)" />
      </g>

      {/* The release card, tilted, with the Pixel Bunny cover */}
      <g
        opacity={clamp01(card * 1.5)}
        transform={`translate(375 177) rotate(${-3 - (1 - card) * 6}) scale(${0.9 + card * 0.1}) translate(-375 -177)`}
      >
        <rect x="300" y="72" width="150" height="208" rx="10" fill={DY.slab} stroke="rgba(255, 255, 255, 0.08)" />
        <Line x={311} y={80} w={40} h={5} fill={DY.light} />
        <Line x={410} y={80} w={30} h={5} />
        <rect x={COVER.x} y={COVER.y} width={COVER.size} height={COVER.size} rx="2" fill={DY.blue} />
        <path
          d={`M${COVER.x + 4} ${COVER.y + 12}v-8h8 M${COVER.x + COVER.size - 12} ${COVER.y + 4}h8v8 M${COVER.x + 4} ${COVER.y + COVER.size - 12}v8h8 M${COVER.x + COVER.size - 12} ${COVER.y + COVER.size - 4}h8v-8`}
          fill="none"
          stroke="rgba(255, 255, 255, 0.55)"
          strokeWidth="1.5"
        />
        <g shapeRendering="crispEdges">
          {BUNNY.map((row, r) =>
            [...row].map((c, col) =>
              c === '.' ? null : (
                <rect
                  key={`${r}-${col}`}
                  x={bunnyAt[0] + col * bunnyPx}
                  y={bunnyAt[1] + r * bunnyPx}
                  width={bunnyPx}
                  height={bunnyPx}
                  fill={BUNNY_FILL[c]}
                  opacity={seg(t, 1.2 + r * 0.05, 1.3 + r * 0.05)}
                />
              ),
            ),
          )}
        </g>
        <Line x={311} y={230} w={64} h={7} fill={DY.text} />
        <Line x={311} y={242} w={30} h={4} />
        <rect x="408" y="229" width="31" height="11" rx="3" fill="none" stroke="rgba(255, 255, 255, 0.28)" />
        <circle cx="319" cy="262" r="8" fill={DY.blue} />
        <path d="M316.5 258.5l6 3.5-6 3.5z" fill="#fff" />
        <Line x={333} y={260} w={34} h={4} fill="rgba(255, 255, 255, 0.16)" />
      </g>

      {/* The player, rising from the bottom edge, its waveform filling in as it plays */}
      {st.player > 0.01 && (
        <g transform={`translate(${PLAYER.x} ${PLAYER.y + (1 - st.player) * 80})`}>
          <rect width={PLAYER.w} height={PLAYER.h} rx="10" fill={DY.slab} stroke="rgba(255, 255, 255, 0.1)" />
          <rect x="10" y="10" width="36" height="36" rx="2" fill={DY.blue} />
          <rect x="22" y="22" width="12" height="12" fill="#a6ece4" />
          <Line x={56} y={12} w={54} h={6} fill={DY.text} />
          <Line x={116} y={12.5} w={26} h={5} />
          <circle cx="220" cy="16" r="7" fill={DY.blue} />
          <rect x="217" y="12.5" width="2" height="7" fill="#fff" />
          <rect x="221" y="12.5" width="2" height="7" fill="#fff" />
          {WAVE.map((h, i) => (
            <rect
              key={i}
              x={56 + i * 4}
              y={40 - h / 2}
              width="2.4"
              height={h}
              rx="1"
              fill={i / WAVE.length < st.progress ? DY.blue : 'rgba(255, 255, 255, 0.22)'}
            />
          ))}
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
