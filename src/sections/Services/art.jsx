import { useEffect, useId, useRef, useState } from 'react'
import { Check, Clock, Lock } from 'lucide-react'
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
  useTimeline,
} from '../../lib/motion.js'
import AiLogo from '../../components/AiLogo/AiLogo.jsx'
import useInView from '../../hooks/useInView.js'
import s from './art.module.css'

/*
 * One motion-graphics illustration per service. Same grammar as the rest of
 * the site: an intro that plays once, then a loop of actions that each start
 * and end in the settled state. Surfaces from the page ladder, the accent as
 * the only colour, no gradients.
 */

const Ripple = ({ x, y, k, r = 14 }) =>
  k > 0 && k < 1 ? (
    <circle className={s.ripple} cx={x} cy={y} r={3 + r * easeOutCubic(k)} opacity={(1 - k) * 0.9} />
  ) : null

/** Scale a group about its own centre. */
const about = (cx, cy, k) => `translate(${cx} ${cy}) scale(${k}) translate(${-cx} ${-cy})`

/* ================================================================== */
/* 1. Websites — a page builds itself, then goes live                 */
/* ================================================================== */

const SITE_INTRO = 2.4
const SITE_ACTIONS = [
  { name: 'layout', dur: 2.6 },
  { name: 'domain', dur: 3.2 },
  { name: 'score', dur: 2.8 },
]
const SITE_LOOP = loopLength(SITE_ACTIONS)
const DOMAIN = 'yourbusiness.com'

export function WebsiteArt() {
  const [ref, t] = useTimeline({ intro: SITE_INTRO, loop: SITE_LOOP, still: SITE_INTRO + 2.6 + 2.2 })

  const frame = easeOutBack(seg(t, 0, 0.45), 1.4)
  const nav = easeOutCubic(seg(t, 0.35, 0.7))
  const bar = (i) => easeOutCubic(seg(t, 0.5 + i * 0.1, 0.9 + i * 0.1))
  const image = easeOutBack(seg(t, 0.75, 1.15), 1.8)
  const card = (i) => easeOutBack(seg(t, 1.0 + i * 0.12, 1.4 + i * 0.12), 1.8)
  const footer = easeOutCubic(seg(t, 1.45, 1.8))
  const badge = easeOutBack(seg(t, 1.7, 2.05), 2.2)
  const hours = Math.round(48 * easeOutCubic(seg(t, 0.2, 1.9)))

  let swap = 0
  let typed = DOMAIN.length
  let lock = t < SITE_INTRO ? easeOutBack(seg(t, 1.9, 2.2), 2) : 1
  let live = 0
  let liveRipple = 0
  let score = 0
  let scoreIn = 0

  if (t >= SITE_INTRO) {
    const [name, u] = actionAt(t - SITE_INTRO, SITE_ACTIONS)
    if (name === 'layout') {
      // Hero text and image trade sides, hold, trade back
      swap = easeInOutCubic(seg(u, 0.2, 0.9)) * (1 - easeInOutCubic(seg(u, 1.6, 2.3)))
    }
    if (name === 'domain') {
      // Domain is cleared and typed back in, then the site goes live
      const erase = seg(u, 0.1, 0.5)
      const retype = seg(u, 0.6, 1.4)
      typed = Math.round(DOMAIN.length * (u < 0.55 ? 1 - erase : retype))
      lock = u < 0.55 ? 1 - easeInBack(seg(u, 0.05, 0.25)) : easeOutBack(seg(u, 1.4, 1.65), 2.4)
      live = easeOutBack(seg(u, 1.6, 1.9), 2.2) * (1 - easeInBack(seg(u, 2.7, 3.0)))
      liveRipple = seg(u, 1.65, 2.2)
    }
    if (name === 'score') {
      scoreIn = easeOutBack(seg(u, 0.1, 0.45), 2) * (1 - easeInBack(seg(u, 2.3, 2.65)))
      score = easeOutCubic(seg(u, 0.35, 1.4))
    }
  }

  const textX = lerp(0, 98, swap)
  const imageX = lerp(0, -98, swap)
  const lift = Math.sin(Math.PI * swap) * 6

  return (
    <svg ref={ref} className={s.art} viewBox="0 0 240 180" aria-hidden="true">
      <g transform={about(120, 90, frame)} opacity={clamp01(frame * 2)}>
        {/* Browser */}
        <rect className={s.frame} x="16" y="14" width="208" height="152" rx="14" />
        {[28, 36, 44].map((cx) => (
          <circle key={cx} className={s.raise3} cx={cx} cy="24" r="2.5" />
        ))}
        <rect className={s.raise2} x="60" y="18" width="140" height="12" rx="6" />
        {lock > 0.01 && <Lock className={s.lockIcon} x={66} y={20.5} size={7} strokeWidth={2.5} opacity={clamp01(lock)} />}
        <text className={s.url} x="76" y="26.6">
          {DOMAIN.slice(0, typed)}
        </text>

        {/* Nav */}
        <g opacity={nav}>
          <rect className={s.accent} x="26" y="40" width="16" height="6" rx="3" />
          {[152, 170, 188].map((x) => (
            <rect key={x} className={s.raise2} x={x} y="41" width="12" height="4" rx="2" />
          ))}
        </g>

        {/* Hero: copy and image, which trade places in the layout action */}
        <g transform={`translate(${textX} ${-lift})`}>
          <rect className={s.raise3} x="26" y="58" width={70 * bar(0)} height="8" rx="4" />
          <rect className={s.raise2} x="26" y="72" width={84 * bar(1)} height="4" rx="2" />
          <rect className={s.raise2} x="26" y="80" width={60 * bar(2)} height="4" rx="2" />
          <rect className={s.accent} x="26" y="90" width={30 * bar(3)} height="9" rx="4.5" />
        </g>
        <g transform={`translate(${imageX} ${lift}) ${about(169, 77, image)}`}>
          <rect className={s.raise2} x="124" y="54" width="90" height="46" rx="8" />
          <circle className={s.raise3} cx="196" cy="66" r="5" />
          <path className={s.raise3} d="M132 94l20-20 14 12 10-8 24 16z" />
        </g>

        {/* Feature cards */}
        {[26, 91, 156].map((x, i) => (
          <g key={x} transform={about(x + 29, 124, card(i))}>
            <rect className={s.tile} x={x} y="108" width="58" height="32" rx="8" />
            <rect className={i === 1 ? s.accent : s.raise3} x={x + 7} y="115" width="10" height="10" rx="3" />
            <rect className={s.raise2} x={x + 7} y="130" width="36" height="4" rx="2" />
          </g>
        ))}

        <rect className={s.raise1} x="26" y="148" width={188 * footer} height="8" rx="4" />
      </g>

      {/* Delivery clock: counts up as the page builds */}
      {badge > 0.01 && (
        <g transform={`translate(206 14) scale(${badge})`}>
          <rect className={s.pill} x="-24" y="-10" width="48" height="20" rx="10" />
          <Clock className={s.pillIcon} x={-18} y={-5} size={10} strokeWidth={2.5} />
          <text className={s.pillText} x="6" y="3.6" textAnchor="middle">
            {hours}h
          </text>
        </g>
      )}

      {/* Domain action: live */}
      {live > 0.01 && (
        <g transform={`translate(196 150) scale(${live})`}>
          <rect className={s.livePill} x="-22" y="-10" width="44" height="20" rx="10" />
          <Check className={s.liveIcon} x={-15} y={-5} size={10} strokeWidth={3} />
          <text className={s.liveText} x="5" y="3.6" textAnchor="middle">
            Live
          </text>
        </g>
      )}
      <Ripple x={196} y={150} k={liveRipple} r={20} />

      {/* Score action: a performance ring */}
      {scoreIn > 0.01 && (
        <g transform={`translate(190 120) scale(${scoreIn})`}>
          <circle className={s.scoreBg} r="22" />
          <circle className={s.scoreTrack} r="16" />
          <circle
            className={s.scoreRing}
            r="16"
            pathLength="1"
            strokeDasharray="1"
            strokeDashoffset={1 - score}
            transform="rotate(-90)"
          />
          <text className={s.scoreText} y="4" textAnchor="middle">
            {Math.round(score * 100)}
          </text>
        </g>
      )}
    </svg>
  )
}

/* ================================================================== */
/* 2. Components — a curated kit that drops into any stack            */
/* ================================================================== */

// Greeting isn't in the pool: it plays once, to open the showcase
const ECHO_STATES = ['thinking', 'typing', 'finished', 'sleeping', 'idle']
const ECHO_SHOWCASE_MS = 30000
const ECHO_HOLD_MS = [2600, 4200] // how long each state plays before the next

/**
 * The real Echo, showing off: once it's on screen it greets you, then jumps
 * between random states for 30 seconds and settles into idle for good. The
 * greeting only ever plays that once. One-shots (greeting, finished) move on
 * as soon as they end rather than waiting out their turn.
 */
function ShowcaseEcho() {
  const ref = useRef(null)
  const seen = useInView(ref, { threshold: 0.5 })
  const [state, setState] = useState('idle')
  const [done, setDone] = useState(false)
  const timer = useRef(0)

  const next = () => {
    clearTimeout(timer.current)
    setState((current) => {
      const options = ECHO_STATES.filter((st) => st !== current)
      return options[Math.floor(Math.random() * options.length)]
    })
    timer.current = setTimeout(next, ECHO_HOLD_MS[0] + Math.random() * (ECHO_HOLD_MS[1] - ECHO_HOLD_MS[0]))
  }

  useEffect(() => {
    if (!seen || done) return undefined
    // Open with the wave; its onFinished moves on to the random states
    setState('greeting')
    const stop = setTimeout(() => {
      clearTimeout(timer.current)
      setDone(true)
      setState('idle')
    }, ECHO_SHOWCASE_MS)
    return () => {
      clearTimeout(timer.current)
      clearTimeout(stop)
    }
    // `next` only touches refs and setters, so it's safe to leave out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seen, done])

  return (
    <div ref={ref}>
      <AiLogo state={state} size={38} followCursor onFinished={() => !done && next()} />
    </div>
  )
}

const KIT_INTRO = 2.0
const KIT_ACTIONS = [
  { name: 'interact', dur: 2.8 },
  { name: 'framework', dur: 2.8 },
]
const KIT_LOOP = loopLength(KIT_ACTIONS)

const TILES = [
  { x: 26, y: 14, from: [-30, -20], rot: -14 },
  { x: 126, y: 14, from: [30, -24], rot: 12 },
  { x: 26, y: 80, from: [-34, 22], rot: 10 },
  { x: 126, y: 80, from: [32, 26], rot: -12 },
]
const TILE_W = 88
const TILE_H = 58
const FRAMEWORKS = ['React', 'Vue', 'Svelte', 'Angular'].reduce((acc, label) => {
  const x = acc.length ? acc[acc.length - 1].x + acc[acc.length - 1].w + 6 : 0
  return [...acc, { label, x, w: label.length * 5.4 + 16 }]
}, [])
const FW_TOTAL = FRAMEWORKS[FRAMEWORKS.length - 1].x + FRAMEWORKS[FRAMEWORKS.length - 1].w
const FW_X0 = 120 - FW_TOTAL / 2

export function ComponentsArt() {
  const [ref, t] = useTimeline({ intro: KIT_INTRO, loop: KIT_LOOP, still: KIT_INTRO + 1.2 })

  let toggle = 0
  let slider = 0.3
  let press = 0
  let pressRipple = 0
  let fw = 0 // highlight position, as a fractional index into FRAMEWORKS
  let flip = () => 0 // per-tile flip progress 0–1

  if (t >= KIT_INTRO) {
    const [name, u] = actionAt(t - KIT_INTRO, KIT_ACTIONS)
    if (name === 'interact') {
      toggle = easeOutBack(seg(u, 0.25, 0.55), 1.6) * (1 - easeOutBack(seg(u, 2.3, 2.6), 1.6))
      slider = 0.3 + 0.5 * easeInOutCubic(seg(u, 0.7, 1.4)) * (1 - easeInOutCubic(seg(u, 1.8, 2.4)))
      press = bell(u, 1.05, 0.12)
      pressRipple = seg(u, 1.05, 1.55)
    }
    if (name === 'framework') {
      // Swap the target framework: the kit flips over and comes back rebuilt
      fw = easeOutBack(seg(u, 0.2, 0.55), 1.6) * (1 - easeOutBack(seg(u, 1.5, 1.85), 1.6))
      flip = (i) => easeInOutCubic(seg(u, 0.45 + i * 0.08, 1.0 + i * 0.08)) + easeInOutCubic(seg(u, 1.75 + i * 0.08, 2.3 + i * 0.08))
    }
  }

  const fwFrom = FRAMEWORKS[0]
  const fwTo = FRAMEWORKS[1]
  const hi = { x: lerp(fwFrom.x, fwTo.x, fw), w: lerp(fwFrom.w, fwTo.w, fw) }

  return (
    <svg ref={ref} className={s.art} viewBox="0 0 240 180" aria-hidden="true">
      {TILES.map((tile, i) => {
        const land = seg(t, 0.1 + i * 0.14, 0.6 + i * 0.14)
        const k = easeOutBack(land, 1.6)
        const dx = tile.from[0] * (1 - k)
        const dy = tile.from[1] * (1 - k)
        const rot = tile.rot * (1 - easeOutCubic(land))
        const f = flip(i) % 1
        const sx = Math.cos(Math.PI * 2 * f)
        const cx = tile.x + TILE_W / 2
        const cy = tile.y + TILE_H / 2
        const content = easeOutBack(seg(t, 0.8 + i * 0.12, 1.15 + i * 0.12), 2)
        return (
          <g
            key={i}
            opacity={clamp01(land * 3)}
            transform={`translate(${cx + dx} ${cy + dy}) rotate(${rot}) scale(${sx} 1) translate(${-cx} ${-cy})`}
          >
            <rect className={s.tile} x={tile.x} y={tile.y} width={TILE_W} height={TILE_H} rx="12" />
            {/* Contents stay mounted through a flip (hidden while it shows its
                back), so the live Echo never restarts */}
            <g transform={about(cx, cy, content)} opacity={sx > 0 ? 1 : 0}>
                {i === 0 && (
                  <g transform={about(cx, cy, 1 - press * 0.1)}>
                    <rect className={s.accent} x={cx - 26} y={cy - 9} width="52" height="18" rx="9" />
                    <rect className={s.ink} x={cx - 14} y={cy - 2} width="28" height="4" rx="2" />
                  </g>
                )}
                {i === 1 && (
                  <g>
                    <rect className={toggle > 0.5 ? s.accent : s.raise3} x={cx - 17} y={cy - 9} width="34" height="18" rx="9" />
                    <circle className={s.knob} cx={cx - 8 + 16 * toggle} cy={cy} r="7" />
                  </g>
                )}
                {i === 2 && (
                  <g>
                    <rect className={s.raise3} x={cx - 30} y={cy - 2} width="60" height="4" rx="2" />
                    <rect className={s.accent} x={cx - 30} y={cy - 2} width={60 * slider} height="4" rx="2" />
                    <circle className={s.knob} cx={cx - 30 + 60 * slider} cy={cy} r="6" />
                  </g>
                )}
                {i === 3 && (
                  // The real Echo, the same component as in the comparison above
                  <foreignObject x={cx - TILE_W / 2} y={cy - TILE_H / 2} width={TILE_W} height={TILE_H}>
                    <div className={s.echoSlot}>
                      <ShowcaseEcho />
                    </div>
                  </foreignObject>
                )}
            </g>
          </g>
        )
      })}
      <Ripple x={TILES[0].x + TILE_W / 2} y={TILES[0].y + TILE_H / 2} k={pressRipple} r={26} />

      {/* Target stack */}
      <g transform={`translate(${FW_X0} 156)`} opacity={easeOutCubic(seg(t, 1.3, 1.7))}>
        {FRAMEWORKS.map((f) => (
          <rect key={f.label} className={s.chip} x={f.x} y="0" width={f.w} height="16" rx="8" />
        ))}
        <rect className={s.chipActive} x={hi.x} y="0" width={hi.w} height="16" rx="8" />
        {FRAMEWORKS.map((f, i) => (
          <text
            key={f.label}
            className={(i === 0 && fw < 0.5) || (i === 1 && fw >= 0.5) ? s.chipTextActive : s.chipText}
            x={f.x + f.w / 2}
            y="11"
            textAnchor="middle"
          >
            {f.label}
          </text>
        ))}
      </g>
    </svg>
  )
}

/* ================================================================== */
/* 3. Mobile apps — one codebase, both platforms                      */
/* ================================================================== */

const APP_INTRO = 2.2
const APP_ACTIONS = [
  { name: 'swipe', dur: 2.8 },
  { name: 'notify', dur: 2.6 },
  { name: 'tabs', dur: 2.6 },
]
const APP_LOOP = loopLength(APP_ACTIONS)
const SCREEN = { x: 84, y: 24, w: 72, h: 140 }
const TABS = [96, 111, 126, 141]

export function MobileArt() {
  const [ref, t] = useTimeline({ intro: APP_INTRO, loop: APP_LOOP, still: APP_INTRO + 2.8 + 1.0 })
  const clip = useId()

  const phone = easeOutBack(seg(t, 0, 0.5), 1.4)
  const phoneY = (1 - easeOutCubic(seg(t, 0, 0.5))) * 24
  const el = (i) => easeOutBack(seg(t, 0.45 + i * 0.1, 0.85 + i * 0.1), 1.8)
  const side = (i) => easeOutBack(seg(t, 1.5 + i * 0.15, 1.9 + i * 0.15), 2.2)

  let page = 0 // 0 = home, 1 = detail
  let finger = null
  let note = 0
  let tab = 0

  if (t >= APP_INTRO) {
    const [name, u] = actionAt(t - APP_INTRO, APP_ACTIONS)
    if (name === 'swipe') {
      page = easeInOutCubic(seg(u, 0.45, 0.95)) * (1 - easeInOutCubic(seg(u, 1.75, 2.25)))
      const drag1 = seg(u, 0.3, 0.95)
      const drag2 = seg(u, 1.6, 2.25)
      if (drag1 > 0 && drag1 < 1) finger = { x: lerp(146, 96, easeInOutCubic(drag1)), y: 94, o: bell(drag1, 0.5, 0.5) }
      if (drag2 > 0 && drag2 < 1) finger = { x: lerp(96, 146, easeInOutCubic(drag2)), y: 94, o: bell(drag2, 0.5, 0.5) }
    }
    if (name === 'notify') {
      note = easeOutBack(seg(u, 0.2, 0.6), 2) * (1 - easeInBack(seg(u, 1.9, 2.3)))
    }
    if (name === 'tabs') {
      tab = easeOutBack(seg(u, 0.3, 0.65), 1.6) * 2 * (1 - easeOutBack(seg(u, 1.7, 2.05), 1.6) * 1)
    }
  }

  const tabX = lerp(TABS[0], TABS[2], tab / 2)
  const bob = (i) => Math.sin(t * 1.6 + i * 2) * 3

  return (
    <svg ref={ref} className={s.art} viewBox="0 0 240 180" aria-hidden="true">
      <defs>
        <clipPath id={clip}>
          <rect x={SCREEN.x} y={SCREEN.y} width={SCREEN.w} height={SCREEN.h} rx="10" />
        </clipPath>
      </defs>

      {/* Platforms, one each side */}
      {[
        { x: 42, y: 62, label: 'iOS' },
        { x: 198, y: 118, label: 'Android' },
      ].map((p, i) =>
        side(i) > 0.01 ? (
          <g key={p.label} transform={`translate(${p.x} ${p.y + bob(i)}) scale(${side(i)})`}>
            <rect className={s.chip} x={-p.label.length * 3 - 10} y="-9" width={p.label.length * 6 + 20} height="18" rx="9" />
            <circle className={s.accent} cx={-p.label.length * 3 - 3} cy="0" r="2.5" />
            <text className={s.chipText} x="3" y="3.2" textAnchor="middle">
              {p.label}
            </text>
          </g>
        ) : null,
      )}

      <g transform={`translate(0 ${phoneY}) ${about(120, 90, phone)}`} opacity={clamp01(phone * 2)}>
        <rect className={s.frame} x="78" y="8" width="84" height="164" rx="18" />
        <rect className={s.raise3} x="108" y="13" width="24" height="4" rx="2" />

        <g clipPath={`url(#${clip})`}>
          {/* Home screen */}
          <g transform={`translate(${-page * 80} 0)`}>
            <rect className={s.raise3} x="90" y="30" width={40 * el(0)} height="6" rx="3" />
            <g transform={about(120, 57, el(1))}>
              <rect className={s.tintRect} x="90" y="42" width="60" height="30" rx="8" />
              <rect className={s.accent} x="96" y="50" width="26" height="5" rx="2.5" />
              <rect className={s.raise3} x="96" y="60" width="38" height="4" rx="2" />
            </g>
            {[0, 1, 2].map((r) => (
              <g key={r} opacity={clamp01(el(2 + r))} transform={`translate(${(1 - el(2 + r)) * 10} 0)`}>
                <circle className={s.raise3} cx="96" cy={86 + r * 18} r="5" />
                <rect className={s.raise2} x="106" y={82 + r * 18} width={tab > 1 ? 30 : 40} height="4" rx="2" />
                <rect className={s.raise1} x="106" y={89 + r * 18} width="26" height="3" rx="1.5" />
              </g>
            ))}
          </g>

          {/* Detail screen, one swipe to the right */}
          <g transform={`translate(${(1 - page) * 80} 0)`}>
            <rect className={s.raise2} x="90" y="30" width="60" height="50" rx="8" />
            <circle className={s.raise3} cx="136" cy="44" r="5" />
            <rect className={s.raise3} x="90" y="88" width="46" height="6" rx="3" />
            <rect className={s.raise2} x="90" y="100" width="58" height="4" rx="2" />
            <rect className={s.raise2} x="90" y="108" width="44" height="4" rx="2" />
            <rect className={s.accent} x="90" y="124" width="60" height="12" rx="6" />
          </g>

          {/* Notification */}
          {note > 0.01 && (
            <g transform={`translate(0 ${lerp(-30, 0, note)})`}>
              <rect className={s.note} x="87" y="27" width="66" height="22" rx="8" />
              <circle className={s.accent} cx="97" cy="38" r="4.5" />
              <rect className={s.raise3} x="106" y="33" width="36" height="4" rx="2" />
              <rect className={s.raise2} x="106" y="40" width="26" height="3" rx="1.5" />
            </g>
          )}

          {/* Tab bar */}
          <rect className={s.raise1} x={SCREEN.x} y="148" width={SCREEN.w} height="16" />
          <rect className={s.tintRect} x={tabX - 6} y="150" width="12" height="12" rx="4" opacity={clamp01(el(5))} />
          {TABS.map((x, i) => (
            <circle key={x} className={Math.round(tab) === i ? s.accent : s.raise3} cx={x} cy="156" r="2.5" opacity={clamp01(el(5))} />
          ))}
        </g>
      </g>

      {finger && <circle className={s.finger} cx={finger.x} cy={finger.y} r="7" opacity={finger.o * 0.9} />}
    </svg>
  )
}
