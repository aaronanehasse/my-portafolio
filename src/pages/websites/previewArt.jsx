import {
  actionAt,
  bell,
  clamp01,
  easeInOutCubic,
  easeOutCubic,
  loopLength,
  seg,
  track,
  useTimeline,
} from '../../lib/motion.js'
import s from './previewArt.module.css'

/*
 * The three steps of the free preview, as quiet loops: things fade and slide
 * a few pixels into place, nothing bounces or flies. Intro once, then an
 * action that starts and ends settled, with long pauses in between.
 */

const Cursor = ({ x, y, press = 0, opacity = 1 }) =>
  opacity > 0.01 ? (
    <g transform={`translate(${x} ${y}) scale(${1 - press * 0.1})`} opacity={opacity}>
      <path className={s.cursor} d="M0 0l14 7.5-6.2 1.6L4.8 15.4z" />
    </g>
  ) : null

/** A small label that fades in with a slight rise. */
function Readout({ x, y, text, k }) {
  if (k <= 0.01) return null
  const w = text.length * 5.8 + 18
  return (
    <g transform={`translate(${x} ${y + (1 - k) * 4})`} opacity={k}>
      <rect className={s.readout} x={-w / 2} y="-12" width={w} height="24" rx="8" />
      <text className={s.readoutText} y="4" textAnchor="middle">
        {text}
      </text>
    </g>
  )
}

/** Fade in over [a, b] while sliding up a few px. */
const rise = (t, a, b, px = 6) => {
  const k = easeOutCubic(seg(t, a, b))
  return { opacity: k, transform: `translate(0 ${(1 - k) * px})` }
}
const pressAt = (u, c) => bell(u, c, 0.1)

/* ------------------------------------------------------------------ */
/* 1. Request: the form fills in and is sent                           */
/* ------------------------------------------------------------------ */

const REQ_INTRO = 0.8
const REQ_ACTIONS = [{ name: 'send', dur: 6 }]
const FIELDS = [
  { label: 'Business', w: 86 },
  { label: 'Email', w: 104 },
  { label: 'The site should…', w: 124 },
]
const SEND = [120, 146]
const REQ_REST = [214, 172]

export function RequestArt() {
  const [ref, t] = useTimeline({ intro: REQ_INTRO, loop: loopLength(REQ_ACTIONS), still: REQ_INTRO + 3.2 })

  let typed = () => 0
  let fieldsOpacity = 1
  let press = 0
  let cursor = REQ_REST
  let sentK = 0

  if (t >= REQ_INTRO) {
    const [, u] = actionAt(t - REQ_INTRO, REQ_ACTIONS)
    typed = (i) => easeInOutCubic(seg(u, 0.4 + i * 0.6, 1.0 + i * 0.6))
    cursor = track(u, [[0.1, ...REQ_REST], [2.3, ...REQ_REST], [2.8, ...SEND], [3.2, ...SEND], [3.8, ...REQ_REST]])
    press = pressAt(u, 2.95)
    // The button says "Sent", then the form quietly clears for the next loop
    sentK = easeOutCubic(seg(u, 3.0, 3.3)) * (1 - easeOutCubic(seg(u, 5.0, 5.3)))
    fieldsOpacity = 1 - seg(u, 4.6, 5.0)
  }

  return (
    <svg ref={ref} className={s.art} viewBox="0 0 240 180" aria-hidden="true">
      <g {...rise(t, 0, 0.6)}>
        <rect className={s.slab} x="40" y="18" width="160" height="148" rx="14" />
        {FIELDS.map((f, i) => (
          <g key={f.label}>
            <text className={s.fieldLabel} x="54" y={40 + i * 32}>
              {f.label}
            </text>
            <rect className={s.field} x="54" y={45 + i * 32} width="132" height="16" rx="5" />
            <rect className={s.typed} x="60" y={51 + i * 32} width={f.w * typed(i)} height="4" rx="2" opacity={fieldsOpacity} />
          </g>
        ))}
        <g transform={`translate(${SEND[0]} ${SEND[1]}) scale(${1 - press * 0.03}) translate(${-SEND[0]} ${-SEND[1]})`}>
          <rect className={s.accent} x="54" y="136" width="132" height="20" rx="7" />
          <text className={s.btnText} x={SEND[0]} y="149.5" textAnchor="middle" opacity={1 - sentK}>
            Request preview
          </text>
          <text className={s.btnText} x={SEND[0]} y="149.5" textAnchor="middle" opacity={sentK}>
            Sent ✓
          </text>
        </g>
      </g>
      <Cursor x={cursor[0]} y={cursor[1]} press={press} opacity={seg(t, REQ_INTRO - 0.3, REQ_INTRO)} />
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/* 2. Build: two or three sections, made within hours                  */
/* ------------------------------------------------------------------ */

const BUILD_INTRO = 3.4
const BUILD_ACTIONS = [
  { name: 'hold', dur: 2.6 },
  { name: 'rebuild', dur: 4.2 },
]

export function BuildArt() {
  const [ref, t] = useTimeline({ intro: BUILD_INTRO, loop: loopLength(BUILD_ACTIONS), still: BUILD_INTRO + 0.5 })

  // Build progress 0–1 drives the sections settling in and the clock
  let progress = seg(t, 0.5, 3.0)
  let fade = 1 // the whole preview, faded out briefly before a rebuild
  let ready = easeOutCubic(seg(t, 3.0, 3.4))

  if (t >= BUILD_INTRO) {
    const [name, u] = actionAt(t - BUILD_INTRO, BUILD_ACTIONS)
    progress = 1
    ready = 1
    if (name === 'rebuild') {
      fade = u < 0.6 ? 1 - easeOutCubic(seg(u, 0, 0.5)) : 1
      progress = u < 0.6 ? 1 : seg(u, 0.7, 3.4)
      ready = u < 0.6 ? 1 - seg(u, 0, 0.4) : easeOutCubic(seg(u, 3.5, 3.9))
    }
  }

  // Each section fades in and slides up 6px when its share of the progress arrives
  const section = (i) => {
    const k = easeOutCubic(clamp01((progress - i * 0.3) / 0.4))
    return { opacity: k * fade, transform: `translate(0 ${(1 - k) * 6})` }
  }
  const hours = Math.max(0, Math.round(progress * 3))

  return (
    <svg ref={ref} className={s.art} viewBox="0 0 240 180" aria-hidden="true">
      <g {...rise(t, 0, 0.6)}>
        <rect className={s.slab} x="22" y="24" width="176" height="140" rx="14" />
        {[34, 42, 50].map((cx) => (
          <circle key={cx} className={s.raise3} cx={cx} cy="36" r="2.5" />
        ))}

        {/* Section 1: hero */}
        <g {...section(0)}>
          <rect className={s.raise1} x="32" y="48" width="156" height="44" rx="8" />
          <rect className={s.raise3} x="42" y="58" width="64" height="7" rx="3.5" />
          <rect className={s.raise2} x="42" y="70" width="84" height="4" rx="2" />
          <rect className={s.accent} x="42" y="79" width="28" height="7" rx="3.5" />
          <rect className={s.raise2} x="140" y="56" width="38" height="28" rx="5" />
        </g>
        {/* Section 2: three features */}
        <g {...section(1)}>
          {[32, 85, 138].map((x) => (
            <g key={x}>
              <rect className={s.raise1} x={x} y="98" width="50" height="28" rx="7" />
              <rect className={s.raise3} x={x + 7} y="105" width="10" height="10" rx="3" />
              <rect className={s.raise2} x={x + 7} y="119" width="32" height="3" rx="1.5" />
            </g>
          ))}
        </g>
        {/* Section 3: call to action */}
        <g {...section(2)}>
          <rect className={s.raise1} x="32" y="132" width="156" height="24" rx="7" />
          <rect className={s.raise3} x="42" y="141" width="56" height="5" rx="2.5" />
          <rect className={s.accent} x="148" y="139" width="30" height="10" rx="5" />
        </g>
      </g>

      {/* The clock: hours spent */}
      <g {...rise(t, 0.3, 0.9)}>
        <circle className={s.clockBg} cx="206" cy="30" r="17" />
        <circle
          className={s.clockRing}
          cx="206"
          cy="30"
          r="12"
          pathLength="1"
          strokeDasharray="1"
          strokeDashoffset={1 - progress}
          transform="rotate(-90 206 30)"
        />
        <text className={s.clockText} x="206" y="33.5" textAnchor="middle">
          {hours}h
        </text>
      </g>

      <Readout x={110} y={172} text="Preview ready" k={ready} />
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/* 3. Decide: continue, or walk away and pay nothing                   */
/* ------------------------------------------------------------------ */

const DEC_INTRO = 1.0
const DEC_ACTIONS = [
  { name: 'pass', dur: 4.2 },
  { name: 'keep', dur: 4.2 },
]
const NO = [74, 136]
const YES = [166, 136]
const DEC_REST = [120, 176]

export function DecideArt() {
  const [ref, t] = useTimeline({ intro: DEC_INTRO, loop: loopLength(DEC_ACTIONS), still: DEC_INTRO + 1.8 })

  let cursor = DEC_REST
  let press = 0
  let target = null
  let readout = 0
  let label = ''

  if (t >= DEC_INTRO) {
    const [name, u] = actionAt(t - DEC_INTRO, DEC_ACTIONS)
    target = name === 'pass' ? NO : YES
    cursor = track(u, [[0.1, ...DEC_REST], [0.9, ...target], [1.4, ...target], [2.2, ...DEC_REST]])
    press = pressAt(u, 1.05)
    readout = easeOutCubic(seg(u, 1.15, 1.5)) * (1 - easeOutCubic(seg(u, 3.3, 3.7)))
    label = name === 'pass' ? '$0 · no commitment' : 'Let’s build it'
  }

  // A pressed button settles 1px, like the site's own buttons
  const pressed = (b) => (target === b ? press : 0)

  return (
    <svg ref={ref} className={s.art} viewBox="0 0 240 180" aria-hidden="true">
      {/* The finished preview, small */}
      <g {...rise(t, 0, 0.6)}>
        <rect className={s.slab} x="60" y="18" width="120" height="88" rx="12" />
        <rect className={s.raise1} x="70" y="30" width="100" height="30" rx="6" />
        <rect className={s.raise3} x="78" y="38" width="44" height="5" rx="2.5" />
        <rect className={s.accent} x="78" y="48" width="20" height="5" rx="2.5" />
        {[70, 104, 138].map((x) => (
          <rect key={x} className={s.raise1} x={x} y="66" width="32" height="18" rx="5" />
        ))}
        <rect className={s.raise1} x="70" y="88" width="100" height="10" rx="4" />
      </g>

      <g {...rise(t, 0.3, 0.9)}>
        <g transform={`translate(0 ${pressed(NO)})`}>
          <rect className={s.secondary} x={NO[0] - 40} y={NO[1] - 13} width="80" height="26" rx="9" />
          <text className={s.secondaryText} x={NO[0]} y={NO[1] + 4} textAnchor="middle">
            No thanks
          </text>
        </g>
        <g transform={`translate(0 ${pressed(YES)})`}>
          <rect className={s.accent} x={YES[0] - 40} y={YES[1] - 13} width="80" height="26" rx="9" />
          <text className={s.btnText} x={YES[0]} y={YES[1] + 4} textAnchor="middle">
            Continue
          </text>
        </g>
      </g>

      <Readout x={target ? target[0] : 120} y={104} text={label} k={readout} />
      <Cursor x={cursor[0]} y={cursor[1]} press={press} opacity={seg(t, DEC_INTRO - 0.3, DEC_INTRO)} />
    </svg>
  )
}
