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
import s from './art.module.css'

/*
 * Lumen's product illustrations, made the way the portfolio's are: an intro
 * that plays once, then actions that loop — a cursor demonstrating the
 * product, parts landing with a spring, ripples on every click, small live
 * readouts. Things that should keep moving forward (a week of cash flow, data
 * flowing through the pipeline) run off the raw clock instead of a loop.
 */

const Ripple = ({ x, y, k, r = 14, danger = false }) =>
  k > 0 && k < 1 ? (
    <circle
      className={danger ? s.rippleDanger : s.ripple}
      cx={x}
      cy={y}
      r={3 + r * easeOutCubic(k)}
      opacity={(1 - k) * 0.9}
    />
  ) : null

const Cursor = ({ x, y, press = 0, opacity = 1 }) =>
  opacity > 0.01 ? (
    <g transform={`translate(${x} ${y}) scale(${1 - press * 0.18})`} opacity={opacity}>
      <path className={s.cursor} d="M0 0l14 7.5-6.2 1.6L4.8 15.4z" />
    </g>
  ) : null

function Readout({ x, y, text, k, danger = false }) {
  if (k <= 0.01) return null
  const w = text.length * 5.6 + 16
  return (
    <g transform={`translate(${x} ${y}) scale(${k})`} opacity={clamp01(k)}>
      <rect className={s.readout} x={-w / 2} y="-11" width={w} height="22" rx="7" />
      <text className={danger ? s.readoutDanger : s.readoutText} y="3.6" textAnchor="middle">
        {text}
      </text>
    </g>
  )
}

const about = (cx, cy, k) => `translate(${cx} ${cy}) scale(${k}) translate(${-cx} ${-cy})`
const pressAt = (u, times) => Math.max(0, ...times.map((c) => bell(u, c, 0.09)))
// Repeatable pseudo-random 0–1 per integer, for data that never loops
const noise = (k) => {
  const x = Math.sin(k * 12.9898 + 4.1) * 43758.5453
  return x - Math.floor(x)
}

/* ================================================================== */
/* Categorisation: a scan tags every row; a fix teaches it a rule      */
/* ================================================================== */

const ROWS = [
  { name: 'Stripe payout', amount: '+$3,240', inflow: true, cat: 'Revenue' },
  { name: 'AWS', amount: '−$412', cat: 'Software' },
  { name: 'Uber', amount: '−$38', cat: 'Other', fix: 'Travel' },
  { name: 'Gusto', amount: '−$18,400', cat: 'Payroll' },
]
const ROW_Y = (i) => 20 + i * 46
const CHIP_X = 300
const CAT_INTRO = 2.6
const CAT_ACTIONS = [
  { name: 'fix', dur: 3.8 },
  { name: 'batch', dur: 3.6 },
]
const CAT_LOOP = loopLength(CAT_ACTIONS)
const CAT_REST = [520, 206]
const OPTIONS = ['Travel', 'Meals', 'Software']

/** When a scan line sweeping from `from` to `to` (s) crosses row i. */
const scanAt = (i, from, to) => lerp(from, to, (ROW_Y(i) + 18 - 12) / 190)

export function CategoriseArt() {
  const [ref, t, elapsed] = useTimeline({ intro: CAT_INTRO, loop: CAT_LOOP, still: CAT_INTRO + 2 })

  // Defaults: the settled state (all rows in, all tagged, Uber still "Other")
  let rowIn = () => 1
  let rowOut = () => 0
  let chip = () => 1
  let scan = -1
  let uberFixed = false
  let cursor = CAT_REST
  let cursorIn = t < CAT_INTRO ? seg(t, 2.3, 2.6) : 1
  let press = 0
  let ripple = null
  let dropdown = 0
  let hoverOption = -1
  let learned = 0
  let filed = 0

  if (t < CAT_INTRO) {
    rowIn = (i) => easeOutBack(seg(t, 0.1 + i * 0.12, 0.55 + i * 0.12), 1.4)
    scan = seg(t, 1.0, 2.2)
    chip = (i) => easeOutBack(seg(t, scanAt(i, 1.0, 2.2), scanAt(i, 1.0, 2.2) + 0.3), 2)
  } else {
    const [name, u] = actionAt(t - CAT_INTRO, CAT_ACTIONS)
    const uberChip = [CHIP_X + 46, ROW_Y(2) + 18]
    if (name === 'fix') {
      // Open Uber's tag, pick Travel, and it learns the rule
      const option = [CHIP_X + 46, ROW_Y(2) + 50]
      cursor = track(u, [[0.05, ...CAT_REST], [0.6, ...uberChip], [1.0, ...uberChip], [1.25, ...option], [1.5, ...option], [2.2, ...CAT_REST]])
      press = pressAt(u, [0.65, 1.35])
      dropdown = easeOutBack(seg(u, 0.7, 0.95), 1.8) * (1 - easeInBack(seg(u, 1.4, 1.6)))
      hoverOption = u > 1.15 && u < 1.45 ? 0 : -1
      uberFixed = u > 1.38
      learned = easeOutBack(seg(u, 1.7, 2.0), 2) * (1 - easeInBack(seg(u, 3.2, 3.6)))
      if (u > 0.65 && u < 1.15) ripple = { at: uberChip, k: seg(u, 0.65, 1.15) }
      if (u > 1.4 && u < 1.9) ripple = { at: uberChip, k: seg(u, 1.4, 1.9) }
    }
    if (name === 'batch') {
      // Sorted rows are filed away; a fresh batch arrives and gets tagged
      uberFixed = u < 0.9
      rowOut = (i) => easeInBack(seg(u, 0.1 + i * 0.08, 0.55 + i * 0.08))
      filed = bell(u, 0.95, 0.25)
      rowIn = (i) => (u < 1.0 ? 1 : easeOutBack(seg(u, 1.0 + i * 0.1, 1.45 + i * 0.1), 1.4))
      scan = seg(u, 1.7, 2.9)
      chip = (i) => (u < 1.0 ? 1 : easeOutBack(seg(u, scanAt(i, 1.7, 2.9), scanAt(i, 1.7, 2.9) + 0.3), 2))
    }
  }

  // Never loops: every batch filed (0.95s into each batch action) adds its
  // four rows to the running total
  const fileAt = CAT_ACTIONS[0].dur + 0.95
  const since = elapsed - CAT_INTRO
  const batches = since < fileAt ? 0 : Math.floor((since - fileAt) / CAT_LOOP) + 1
  const sorted = 1284 + batches * 4
  const scanY = 12 + scan * 190

  return (
    <svg ref={ref} className={s.art} viewBox="0 0 560 220" aria-hidden="true">
      {ROWS.map((row, i) => {
        const y = ROW_Y(i)
        const k = rowIn(i)
        const out = rowOut(i)
        const x = -34 * (1 - k) + out * 90
        const cat = row.fix && uberFixed ? row.fix : row.cat
        const c = chip(i)
        return (
          <g key={row.name} transform={`translate(${x} 0)`} opacity={clamp01(k * 2) * (1 - out)}>
            <rect className={s.row} x="20" y={y} width="382" height="36" rx="10" />
            <circle className={s.s3} cx="42" cy={y + 18} r="10" />
            <text className={s.initial} x="42" y={y + 21.5} textAnchor="middle">
              {row.name[0]}
            </text>
            <text className={s.label} x="62" y={y + 22}>
              {row.name}
            </text>
            <text className={row.inflow ? s.amountIn : s.amount} x="284" y={y + 22} textAnchor="end">
              {row.amount}
            </text>
            {c > 0.01 && (
              <g transform={about(CHIP_X + 46, y + 18, c)}>
                <rect className={cat === 'Other' ? s.chipOther : s.chip} x={CHIP_X} y={y + 8} width="92" height="20" rx="10" />
                <text className={cat === 'Other' ? s.chipTextOther : s.chipText} x={CHIP_X + 46} y={y + 21.5} textAnchor="middle">
                  {cat}
                </text>
              </g>
            )}
          </g>
        )
      })}

      {scan > 0 && scan < 1 && (
        <g opacity={bell(scan, 0.5, 0.5)}>
          <rect className={s.scanGlow} x="16" y={scanY - 10} width="390" height="10" />
          <rect className={s.brand} x="16" y={scanY} width="390" height="1.5" />
        </g>
      )}

      {/* Uber's tag, opened */}
      {dropdown > 0.01 && (
        <g transform={about(CHIP_X + 46, ROW_Y(2) + 32, dropdown)} opacity={clamp01(dropdown)}>
          <rect className={s.menu} x={CHIP_X} y={ROW_Y(2) + 32} width="92" height="70" rx="10" />
          {OPTIONS.map((o, j) => (
            <g key={o}>
              {hoverOption === j && <rect className={s.menuHover} x={CHIP_X + 4} y={ROW_Y(2) + 36 + j * 21} width="84" height="20" rx="6" />}
              <text className={s.menuText} x={CHIP_X + 12} y={ROW_Y(2) + 50 + j * 21}>
                {o}
              </text>
            </g>
          ))}
        </g>
      )}

      {/* The running total, off to the side */}
      <g opacity={easeOutCubic(seg(t, 0.4, 0.8))}>
        <rect className={s.panel} x="424" y="20" width="118" height="174" rx="12" />
        <text className={s.muted} x="438" y="44">Sorted this month</text>
        <g transform={about(438, 70, 1 + filed * 0.12)}>
          <text className={s.big} x="438" y="76">
            {sorted.toLocaleString('en-US')}
          </text>
        </g>
        <text className={s.muted} x="438" y="104">Accuracy</text>
        <text className={s.value} x="438" y="122">99.2%</text>
        <rect className={s.s2} x="438" y="140" width="90" height="5" rx="2.5" />
        <rect className={s.brand} x="438" y="140" width="89" height="5" rx="2.5" />
      </g>
      <Readout x={483} y={170} text="Learned: Uber → Travel" k={learned} />

      {ripple && <Ripple x={ripple.at[0]} y={ripple.at[1]} k={ripple.k} />}
      <Cursor x={cursor[0]} y={cursor[1]} press={press} opacity={cursorIn} />
    </svg>
  )
}

/* ================================================================== */
/* Month-end: one click, the checks tick, the report goes out          */
/* ================================================================== */

const CLOSE_INTRO = 1.8
const CLOSE_ACTIONS = [{ name: 'close', dur: 4.8 }]
const CHECKS = ['Bank reconciled', 'Receipts matched', 'Reports ready']
const BTN = { x: 32, y: 156, w: 176, h: 30 }
const ACCOUNTANT = [262, 50]
const CLOSE_REST = [270, 204]

export function CloseArt() {
  const [ref, t] = useTimeline({ intro: CLOSE_INTRO, loop: loopLength(CLOSE_ACTIONS), still: CLOSE_INTRO + 3.0 })

  const card = easeOutBack(seg(t, 0, 0.4), 1.4)
  const rowIn = (i) => easeOutCubic(seg(t, 0.35 + i * 0.12, 0.75 + i * 0.12))
  const btnIn = easeOutBack(seg(t, 0.8, 1.15), 2)
  const personIn = easeOutBack(seg(t, 1.1, 1.45), 2.2)

  let checked = () => 0
  let progress = 0
  let done = 0
  let cursor = CLOSE_REST
  let press = 0
  let ripples = []
  let doc = null
  let sent = 0
  const cursorIn = t < CLOSE_INTRO ? seg(t, 1.5, 1.8) : 1
  const btnCentre = [BTN.x + BTN.w / 2, BTN.y + BTN.h / 2]

  if (t >= CLOSE_INTRO) {
    const [, u] = actionAt(t - CLOSE_INTRO, CLOSE_ACTIONS)
    cursor = track(u, [[0.05, ...CLOSE_REST], [0.55, ...btnCentre], [0.9, ...btnCentre], [1.5, ...CLOSE_REST]])
    press = pressAt(u, [0.6])
    progress = easeInOutCubic(seg(u, 0.7, 2.0)) * (1 - seg(u, 4.2, 4.5))
    const ticks = [1.0, 1.4, 1.8]
    checked = (i) => easeOutBack(seg(u, ticks[i], ticks[i] + 0.3), 2.4) * (1 - easeInOutCubic(seg(u, 4.0 + i * 0.1, 4.3 + i * 0.1)))
    done = easeOutBack(seg(u, 2.05, 2.35), 2) * (1 - seg(u, 4.2, 4.5))
    ripples = [
      { at: btnCentre, k: seg(u, 0.6, 1.1) },
      ...ticks.map((c, i) => ({ at: [48, 70 + i * 30], k: seg(u, c, c + 0.45) })),
      { at: ACCOUNTANT, k: seg(u, 3.1, 3.6), r: 22 },
    ]
    // The report appears over the button and flies to the accountant
    const make = easeOutBack(seg(u, 2.3, 2.55), 2)
    const fly = seg(u, 2.55, 3.1)
    if (make > 0.01 && fly < 1) {
      const k = easeInOutCubic(fly)
      doc = {
        x: lerp(btnCentre[0], ACCOUNTANT[0], k),
        y: lerp(BTN.y - 22, ACCOUNTANT[1], k) - Math.sin(Math.PI * k) * 40,
        scale: make * (1 - 0.55 * k),
      }
    }
    sent = easeOutBack(seg(u, 3.1, 3.4), 2) * (1 - easeInBack(seg(u, 3.9, 4.2)))
  }

  return (
    <svg ref={ref} className={s.art} viewBox="0 0 300 220" aria-hidden="true">
      <g transform={about(120, 110, card)} opacity={clamp01(card * 2)}>
        <rect className={s.panel} x="20" y="14" width="200" height="190" rx="14" />
        <text className={s.label} x="34" y="40">September</text>
        <text className={s.muted} x="206" y="40" textAnchor="end">Books</text>
        {CHECKS.map((label, i) => {
          const y = 70 + i * 30
          const c = checked(i)
          return (
            <g key={label} opacity={rowIn(i)} transform={`translate(${(1 - rowIn(i)) * -12} 0)`}>
              <circle className={s.box} cx="48" cy={y} r="8" />
              {c > 0.01 && (
                <g transform={about(48, y, c)}>
                  <circle className={s.brand} cx="48" cy={y} r="8" />
                  <path className={s.tick} d={`M44 ${y}l3 3 5-6`} />
                </g>
              )}
              <text className={c > 0.5 ? s.label : s.muted} x="64" y={y + 3.5}>
                {label}
              </text>
            </g>
          )
        })}
        <g transform={about(btnCentre[0], btnCentre[1], btnIn * (1 - press * 0.05))}>
          <rect className={s.brand} x={BTN.x} y={BTN.y} width={BTN.w} height={BTN.h} rx="10" />
          <rect className={s.progress} x={BTN.x} y={BTN.y} width={BTN.w * progress} height={BTN.h} rx="10" />
          <text className={s.btnText} x={btnCentre[0]} y={btnCentre[1] + 3.8} textAnchor="middle" opacity={1 - clamp01(done)}>
            Close September
          </text>
          {done > 0.01 && (
            <text className={s.btnText} x={btnCentre[0]} y={btnCentre[1] + 3.8} textAnchor="middle" transform={about(btnCentre[0], btnCentre[1], done)}>
              Closed ✓
            </text>
          )}
        </g>
      </g>

      {/* The accountant */}
      <g transform={about(ACCOUNTANT[0], ACCOUNTANT[1], personIn)}>
        <circle className={s.person} cx={ACCOUNTANT[0]} cy={ACCOUNTANT[1]} r="17" />
        <text className={s.initial} x={ACCOUNTANT[0]} y={ACCOUNTANT[1] + 3.5} textAnchor="middle">JD</text>
        <text className={s.tiny} x={ACCOUNTANT[0]} y={ACCOUNTANT[1] + 30} textAnchor="middle">Accountant</text>
      </g>

      {doc && (
        <g transform={`translate(${doc.x} ${doc.y}) scale(${doc.scale})`}>
          <rect className={s.doc} x="-13" y="-16" width="26" height="32" rx="4" />
          {[-8, -3, 2, 7].map((dy, i) => (
            <rect key={dy} className={i === 0 ? s.brand : s.docLine} x="-8" y={dy} width={i === 0 ? 10 : 16} height="2.5" rx="1.25" />
          ))}
        </g>
      )}
      <Readout x={ACCOUNTANT[0] - 10} y={ACCOUNTANT[1] + 50} text="Report sent" k={sent} />

      {ripples.map((r, i) => (
        <Ripple key={i} x={r.at[0]} y={r.at[1]} k={r.k} r={r.r} />
      ))}
      <Cursor x={cursor[0]} y={cursor[1]} press={press} opacity={cursorIn} />
    </svg>
  )
}

/* ================================================================== */
/* Security: data flows through the shield; writes bounce off it       */
/* ================================================================== */

const SEC_INTRO = 2.0
const SEC_ACTIONS = [
  { name: 'sync', dur: 2.8 },
  { name: 'block', dur: 2.6 },
]
const BANK = [48, 104]
const LUMEN = [252, 104]
const SHIELD = [150, 104]

export function SecurityArt() {
  const [ref, t] = useTimeline({ intro: SEC_INTRO, loop: loopLength(SEC_ACTIONS), still: SEC_INTRO + 1.0 })

  const bankIn = easeOutBack(seg(t, 0.1, 0.45), 1.8)
  const lumenIn = easeOutBack(seg(t, 0.3, 0.65), 1.8)
  const wire = easeInOutCubic(seg(t, 0.55, 1.1))
  const shieldIn = easeOutBack(seg(t, 1.0, 1.35), 2)
  // The shackle drops shut with a bounce
  const lock = t < SEC_INTRO ? easeOutBack(seg(t, 1.35, 1.7), 3) : 1
  const chipIn = easeOutBack(seg(t, 1.55, 1.85), 2)

  let packets = []
  let pulse = bell(t, 1.4, 0.15)
  let bad = null
  let shake = 0
  let blocked = 0
  let hit = 0

  if (t >= SEC_INTRO) {
    const [name, u] = actionAt(t - SEC_INTRO, SEC_ACTIONS)
    if (name === 'sync') {
      // Three reads travel bank → Lumen, encrypted as they pass the shield
      packets = [0, 0.45, 0.9].map((d) => {
        const k = seg(u, 0.2 + d, 1.5 + d)
        const x = lerp(BANK[0] + 30, LUMEN[0] - 30, easeInOutCubic(k))
        return { x, k, locked: x > SHIELD[0] }
      })
      pulse = Math.max(...[0, 0.45, 0.9].map((d) => bell(u, 0.2 + d + 0.65, 0.12)))
    }
    if (name === 'block') {
      // A write heads for the bank, hits the shield and is thrown back
      const go = seg(u, 0.2, 0.85)
      const back = seg(u, 0.85, 1.4)
      const x = u < 0.85 ? lerp(LUMEN[0] - 30, SHIELD[0] + 26, easeInOutCubic(go)) : lerp(SHIELD[0] + 26, LUMEN[0] - 40, easeOutBack(back, 1.6))
      bad = { x, opacity: go > 0 ? 1 - seg(u, 1.4, 1.7) : 0 }
      hit = seg(u, 0.85, 1.35)
      shake = u > 0.85 && u < 1.4 ? Math.sin((u - 0.85) * 60) * 4 * (1 - seg(u, 0.85, 1.4)) : 0
      blocked = easeOutBack(seg(u, 0.95, 1.25), 2) * (1 - easeInBack(seg(u, 2.1, 2.4)))
    }
  }

  return (
    <svg ref={ref} className={s.art} viewBox="0 0 300 220" aria-hidden="true">
      {/* The wire, drawn in */}
      <path className={s.wire} d={`M${BANK[0] + 30} ${BANK[1]} H${LUMEN[0] - 30}`} pathLength="1" strokeDasharray="1" strokeDashoffset={1 - wire} />

      {/* Bank */}
      <g transform={about(BANK[0], BANK[1], bankIn)}>
        <rect className={s.panel} x={BANK[0] - 28} y={BANK[1] - 28} width="56" height="56" rx="14" />
        <path className={s.s3} d={`M${BANK[0] - 14} ${BANK[1] - 6}h28l-14-9z`} />
        {[-9, -1, 7].map((dx) => (
          <rect key={dx} className={s.s3} x={BANK[0] + dx - 1} y={BANK[1] - 4} width="4" height="12" rx="1" />
        ))}
        <rect className={s.s3} x={BANK[0] - 14} y={BANK[1] + 9} width="28" height="3" rx="1.5" />
        <text className={s.tiny} x={BANK[0]} y={BANK[1] + 44} textAnchor="middle">Your bank</text>
      </g>

      {/* Lumen */}
      <g transform={about(LUMEN[0], LUMEN[1], lumenIn)}>
        <rect className={s.brand} x={LUMEN[0] - 26} y={LUMEN[1] - 26} width="52" height="52" rx="15" />
        {[-7, 0, 7].map((dy, i) => (
          <path key={dy} className={i === 0 ? s.layerTop : s.layer} d={`M${LUMEN[0] - 12} ${LUMEN[1] + dy}l12-6 12 6-12 6z`} />
        ))}
        <text className={s.tiny} x={LUMEN[0]} y={LUMEN[1] + 44} textAnchor="middle">Lumen</text>
      </g>

      {/* Read packets */}
      {packets.map((p, i) =>
        p.k > 0 && p.k < 1 ? (
          <rect key={i} className={p.locked ? s.brand : s.packet} x={p.x - 5} y={SHIELD[1] - 5} width="10" height="10" rx="3" />
        ) : null,
      )}

      {/* Shield with its lock */}
      <g transform={`translate(${shake} 0) ${about(SHIELD[0], SHIELD[1], shieldIn * (1 + pulse * 0.08))}`}>
        <path
          className={s.shield}
          d={`M${SHIELD[0]} ${SHIELD[1] - 30}l24 9v18c0 16-11 26-24 31c-13-5-24-15-24-31v-18z`}
        />
        <rect className={s.lockBody} x={SHIELD[0] - 8} y={SHIELD[1] - 2} width="16" height="13" rx="3" />
        <path
          className={s.shackle}
          d={`M${SHIELD[0] - 5} ${SHIELD[1] - 2 - (1 - lock) * 6}v-5a5 5 0 0 1 10 0v5`}
        />
      </g>
      <g transform={about(SHIELD[0], 170, chipIn)}>
        <rect className={s.chip} x={SHIELD[0] - 34} y="160" width="68" height="20" rx="10" />
        <text className={s.chipText} x={SHIELD[0]} y="173.5" textAnchor="middle">Read-only</text>
      </g>

      {/* A write that doesn't get through */}
      {bad && bad.opacity > 0.01 && (
        <g opacity={bad.opacity}>
          <rect className={s.danger} x={bad.x - 6} y={SHIELD[1] - 6} width="12" height="12" rx="3" />
        </g>
      )}
      <Ripple x={SHIELD[0] + 22} y={SHIELD[1]} k={hit} r={20} danger />
      <Readout x={SHIELD[0]} y={40} text="Write blocked" k={blocked} danger />
    </svg>
  )
}

/* ================================================================== */
/* Cash flow: a week that keeps rolling forward, day by day            */
/* ================================================================== */

const DAY_S = 2.8 // seconds per day
const SLOT = 60
const BASE_Y = 128
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const inflow = (k) => 22 + noise(k) * 62
const outflow = (k) => 10 + noise(k + 99) * 34

export function CashflowArt() {
  const [ref, , elapsed] = useTimeline({ intro: 1.6, loop: 1, still: 1.6 + DAY_S * 0.5 })

  // Day position: holds, then glides one slot left
  const whole = Math.floor(elapsed / DAY_S)
  const phase = (elapsed % DAY_S) / DAY_S
  const day = whole + easeInOutCubic(clamp01((phase - 0.72) / 0.28))
  const first = Math.floor(day) - 1

  const bars = []
  for (let k = first; k <= first + 9; k++) {
    const x = 36 + (k - day) * SLOT
    const visibleIndex = k - Math.floor(day)
    // Intro: bars grow in left to right; later, each new day grows in at the right
    const intro = easeOutBack(seg(elapsed, 0.1 + visibleIndex * 0.08, 0.5 + visibleIndex * 0.08), 1.6)
    const arrive = x > 36 + 7.5 * SLOT ? easeOutBack(clamp01((36 + 8.5 * SLOT - x) / SLOT), 1.6) : 1
    const grow = Math.min(intro, arrive)
    const edge = clamp01((x - 10) / 30) * clamp01((528 - x) / 30)
    bars.push({ k, x, grow, edge })
  }

  // Balance line over the bars
  const bal = (k) => 58 - noise(k + 7) * 22 - Math.sin(k * 0.8) * 8
  const linePts = bars.map((b) => `${b.x + 11},${bal(b.k)}`).join(' ')
  const lineIn = easeOutCubic(seg(elapsed, 0.6, 1.4))

  // Every other day the cursor comes in and inspects a bar
  const inspecting = whole % 2 === 0 && elapsed > 1.8
  const u = (elapsed % DAY_S) - 0.2
  const target = bars.find((b) => b.x > 300 && b.x < 360) ?? bars[5]
  const cursor = inspecting
    ? track(u, [[0, 560, 230], [0.5, target.x + 11, BASE_Y - inflow(target.k) + 10], [1.5, target.x + 11, BASE_Y - inflow(target.k) + 10], [1.95, 560, 230]])
    : [560, 230]
  const cursorIn = inspecting ? clamp01(u * 5) * (1 - seg(u, 1.7, 1.95)) : 0
  const readout = inspecting ? easeOutBack(seg(u, 0.55, 0.8), 2) * (1 - easeInBack(seg(u, 1.35, 1.6))) : 0

  return (
    <svg ref={ref} className={s.art} viewBox="0 0 560 220" aria-hidden="true">
      <g opacity={easeOutCubic(seg(elapsed, 0, 0.4))}>
        <circle className={s.brand} cx="30" cy="22" r="4" />
        <text className={s.muted} x="40" y="25.5">In</text>
        <circle className={s.s3} cx="70" cy="22" r="4" />
        <text className={s.muted} x="80" y="25.5">Out</text>
        <text className={s.muted} x="530" y="25.5" textAnchor="end">Balance</text>
        <path className={s.balanceKey} d="M478 22h14" />
      </g>

      <rect className={s.baseline} x="16" y={BASE_Y} width={528 * easeInOutCubic(seg(elapsed, 0, 0.6))} height="1" />

      {bars.map((b) => (
        <g key={b.k} opacity={b.edge}>
          <rect
            className={b.k === target.k && readout > 0.3 ? s.barHot : s.brand}
            x={b.x}
            y={BASE_Y - inflow(b.k) * b.grow}
            width="22"
            height={inflow(b.k) * b.grow}
            rx="4"
          />
          <rect className={s.s3} x={b.x} y={BASE_Y + 3} width="22" height={outflow(b.k) * b.grow} rx="4" />
          <text className={s.tiny} x={b.x + 11} y={BASE_Y + 62} textAnchor="middle">
            {DAYS[((b.k % 7) + 7) % 7]}
          </text>
        </g>
      ))}

      <polyline className={s.balance} points={linePts} opacity={lineIn} />

      <Readout
        x={target.x + 11}
        y={BASE_Y - inflow(target.k) - 22}
        text={`+$${Math.round(inflow(target.k) * 62).toLocaleString('en-US')} · −$${Math.round(outflow(target.k) * 55).toLocaleString('en-US')}`}
        k={readout}
      />
      <Cursor x={cursor[0]} y={cursor[1]} opacity={cursorIn} />
    </svg>
  )
}

/* ================================================================== */
/* Pipeline: accounts → Lumen → accountant, always flowing             */
/* ================================================================== */

const SOURCES = [
  { label: 'Bank', y: 52 },
  { label: 'Card', y: 100 },
  { label: 'Stripe', y: 148 },
]
const HUB = [450, 100]
const OUT = [790, 100]

/** Point on a cubic bézier from a to b that leaves and arrives horizontally. */
function curve(a, b, k) {
  const mx = (a[0] + b[0]) / 2
  const p = [a, [mx, a[1]], [mx, b[1]], b]
  const m = 1 - k
  const x = m ** 3 * p[0][0] + 3 * m ** 2 * k * p[1][0] + 3 * m * k ** 2 * p[2][0] + k ** 3 * p[3][0]
  const y = m ** 3 * p[0][1] + 3 * m ** 2 * k * p[1][1] + 3 * m * k ** 2 * p[2][1] + k ** 3 * p[3][1]
  return [x, y]
}
const curvePath = (a, b) => {
  const mx = (a[0] + b[0]) / 2
  return `M${a} C${mx},${a[1]} ${mx},${b[1]} ${b}`
}

export function PipelineArt() {
  const [ref, , elapsed] = useTimeline({ intro: 1.6, loop: 1, still: 3.2 })

  const pop = (at) => easeOutBack(seg(elapsed, at, at + 0.4), 1.8)
  const draw = easeInOutCubic(seg(elapsed, 0.5, 1.3))

  // Raw transactions: one every 0.5s from a rotating source, 1.4s to reach the hub
  const packets = []
  const live = elapsed - 1.3
  for (let n = Math.floor(live / 0.5) - 3; n <= Math.floor(live / 0.5); n++) {
    if (n < 0) continue
    const k = (live - n * 0.5) / 1.4
    if (k <= 0 || k >= 1) continue
    const src = SOURCES[n % 3]
    const [x, y] = curve([150, src.y], [HUB[0] - 40, HUB[1]], easeInOutCubic(k))
    packets.push({ n, x, y })
  }
  // Each packet lands 1.4s after it leaves, i.e. 0.4s into every 0.5s cycle
  const hubPulse = live > 1.4 ? bell(live % 0.5, 0.4, 0.08) : 0

  // Every 3s a finished report travels out to the accountant
  const reportK = live > 1.5 ? ((live - 1.5) % 3) / 1.4 : -1
  const report = reportK > 0 && reportK < 1 ? curve([HUB[0] + 40, HUB[1]], [OUT[0] - 36, OUT[1]], easeInOutCubic(reportK)) : null
  const arrived = live > 1.5 ? seg((live - 1.5) % 3, 1.4, 1.9) : 0
  const spin = elapsed * 40

  return (
    <svg ref={ref} className={s.art} viewBox="0 0 900 200" aria-hidden="true">
      {SOURCES.map((src) => (
        <path key={src.label} className={s.wire} d={curvePath([150, src.y], [HUB[0] - 40, HUB[1]])} pathLength="1" strokeDasharray="1" strokeDashoffset={1 - draw} />
      ))}
      <path className={s.wire} d={curvePath([HUB[0] + 40, HUB[1]], [OUT[0] - 36, OUT[1]])} pathLength="1" strokeDasharray="1" strokeDashoffset={1 - draw} />

      {/* Sources */}
      {SOURCES.map((src, i) => (
        <g key={src.label} transform={about(100, src.y, pop(0.1 + i * 0.1))}>
          <rect className={s.row} x="50" y={src.y - 17} width="100" height="34" rx="10" />
          <circle className={s.s3} cx="68" cy={src.y} r="7" />
          <text className={s.label} x="82" y={src.y + 4}>{src.label}</text>
        </g>
      ))}

      {packets.map((p) => (
        <rect key={p.n} className={s.packet} x={p.x - 5} y={p.y - 5} width="10" height="10" rx="3" />
      ))}

      {/* Lumen hub: sorting, with an orbit */}
      <g transform={about(HUB[0], HUB[1], pop(0.4) * (1 + hubPulse * 0.05))}>
        <circle className={s.orbit} cx={HUB[0]} cy={HUB[1]} r="54" />
        {[0, 120, 240].map((a) => {
          const r = ((a + spin) * Math.PI) / 180
          return <circle key={a} className={s.brand} cx={HUB[0] + Math.cos(r) * 54} cy={HUB[1] + Math.sin(r) * 54} r="3.5" />
        })}
        <rect className={s.brand} x={HUB[0] - 36} y={HUB[1] - 36} width="72" height="72" rx="20" />
        {[-10, 0, 10].map((dy, i) => (
          <path key={dy} className={i === 0 ? s.layerTop : s.layer} d={`M${HUB[0] - 17} ${HUB[1] + dy}l17-8.5 17 8.5-17 8.5z`} />
        ))}
      </g>

      {report && (
        <g transform={`translate(${report[0]} ${report[1]})`}>
          <rect className={s.doc} x="-11" y="-14" width="22" height="28" rx="4" />
          <rect className={s.brand} x="-7" y="-8" width="9" height="2.5" rx="1.25" />
          <rect className={s.docLine} x="-7" y="-2" width="14" height="2.5" rx="1.25" />
          <rect className={s.docLine} x="-7" y="4" width="11" height="2.5" rx="1.25" />
        </g>
      )}

      {/* Accountant */}
      <g transform={about(OUT[0], OUT[1], pop(0.7) * (1 + bell(arrived, 0.3, 0.3) * 0.08))}>
        <rect className={s.panel} x={OUT[0] - 36} y={OUT[1] - 36} width="72" height="72" rx="20" />
        <circle className={s.person} cx={OUT[0]} cy={OUT[1] - 6} r="14" />
        <text className={s.initial} x={OUT[0]} y={OUT[1] - 2.5} textAnchor="middle">JD</text>
        <rect className={s.s3} x={OUT[0] - 18} y={OUT[1] + 16} width="36" height="4" rx="2" />
      </g>
      <Ripple x={OUT[0] - 36} y={OUT[1]} k={arrived} r={22} />
    </svg>
  )
}
