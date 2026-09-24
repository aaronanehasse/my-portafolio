import { ArrowUpRight, Calendar, Link2, MapPin } from 'lucide-react'
import b from './builds.module.css'

/*
 * Each build is a tiny UI component that assembles itself in stages.
 * Props: s = current stage, p = typing progress (0–1),
 *        t = ms since it finished building, live = finished and "in use".
 * `stages` are the style/markup lines flashed above it while it builds.
 *
 * Styling follows the visual language: surfaces from the ladder, no gradients
 * or glows, the hairline only on small raised items, concentric radii.
 */

const cx = (...c) => c.filter(Boolean).join(' ')
const pop = (on) => cx(b.pop, on && b.in)
const clamp = (v) => Math.min(1, Math.max(0, v))
const easeOut = (v) => 1 - (1 - v) ** 3

function Cursor({ className }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24">
      <path
        d="M5 3l14 7.5-6.2 1.6L10 18.5z"
        fill="#fff"
        stroke="#0b0b0b"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/* ---- 1. Primary action with a secondary icon button ---- */

function BookCall({ s, t }) {
  // The cursor glides in, hovers (lift), presses (settles back), releases.
  const arrived = t > 80
  const hover = t > 520
  const pressed = t > 820 && t < 960
  return (
    <div className={b.btnRow}>
      <span
        className={cx(
          b.btn,
          s >= 1 && b.padded,
          s >= 2 && b.filled,
          s >= 3 && b.rounded,
          hover && !pressed && b.hover,
        )}
      >
        <span className={cx(b.collapse, b.lead, pop(s >= 5))}>
          <Calendar className={b.icon} size={16} />
        </span>
        <span className={cx(b.collapse, pop(s >= 4))}>Book a call</span>
      </span>
      <span className={cx(b.iconBtn, pop(s >= 6))}>
        <Link2 className={b.icon} size={16} />
      </span>
      <Cursor className={cx(b.cursor, arrived && b.cursorIn, pressed && b.cursorDown)} />
    </div>
  )
}

/* ---- 2. Profile card ---- */

function ProfileCard({ s, live }) {
  return (
    <div className={cx(b.card, s >= 1 && b.solid)}>
      <div className={b.profileHead}>
        <span className={cx(b.avatar, pop(s >= 2))}>
          MC
          <i className={b.presence} />
        </span>
        <span className={cx(b.tag, pop(s >= 5), live && b.tagLive)}>
          <i className={b.dot} />
          Available
        </span>
      </div>
      <div className={cx(b.stack, pop(s >= 3))}>
        <span className={b.name}>Maya Chen</span>
        <span className={b.muted}>Product designer at Linear</span>
      </div>
      <span className={cx(b.meta, pop(s >= 4))}>
        <MapPin className={b.icon} size={12} />
        Lisbon <span className={b.sep}>·</span> 14:32 local
      </span>
      <div className={cx(b.actions, pop(s >= 6))}>
        <span className={cx(b.sBtn, b.sPrimary)}>Message</span>
        <span className={cx(b.sBtn, b.sSecondary)}>View profile</span>
      </div>
    </div>
  )
}

/* ---- 3. Settings group ---- */

function Setting({ label, help, shown, switchShown, on }) {
  return (
    <div className={cx(b.setting, pop(shown))}>
      <div className={b.stack}>
        <span className={b.settingLabel}>{label}</span>
        <span className={b.help}>{help}</span>
      </div>
      <span className={cx(b.switch, pop(switchShown), on && b.on)} />
    </div>
  )
}

function Notifications({ s, t }) {
  return (
    <div className={cx(b.card, b.inset, s >= 1 && b.solid)}>
      <div className={cx(b.groupHead, pop(s >= 2))}>
        <span className={b.title}>Notifications</span>
        <span className={b.help}>Choose what reaches your inbox</span>
      </div>
      <Setting label="Product updates" help="Once a month" shown={s >= 3} switchShown={s >= 4} on={t > 400} />
      <Setting label="Mentions" help="When someone tags you" shown={s >= 5} switchShown={s >= 6} on={t > 1100} />
    </div>
  )
}

/* ---- 4. Metric with a weekly bar chart ---- */

const WEEK = [1320, 1710, 1480, 1960, 1840, 2140, 1530]
const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const PEAK = WEEK.indexOf(Math.max(...WEEK))
const MAX = Math.max(...WEEK)

function StatsCard({ s, p, t }) {
  const count = Math.round(12480 * easeOut(clamp((p - 0.4) / 0.45)))
  return (
    <div className={cx(b.card, s >= 1 && b.solid)}>
      <span className={cx(b.label, pop(s >= 2))}>Weekly visitors</span>
      <div className={b.metricRow}>
        <span className={cx(b.number, pop(s >= 3))}>{count.toLocaleString('en-US')}</span>
        <span className={cx(b.delta, pop(s >= 4))}>
          <ArrowUpRight className={b.icon} size={11} strokeWidth={2.5} />
          18.2%
        </span>
      </div>
      <div className={b.chart}>
        {WEEK.map((v, i) => (
          <div key={i} className={b.col}>
            <span
              className={cx(b.bar, i === PEAK && s >= 6 && b.barPeak)}
              style={{ height: s >= 5 ? `${(v / MAX) * 62}%` : '4%', transitionDelay: `${i * 45}ms` }}
            >
              {i === PEAK && (
                <span className={b.tooltipAnchor}>
                  <span className={cx(b.tooltip, pop(t > 350))}>
                    <span className={b.help}>Sat</span> 2,140
                  </span>
                </span>
              )}
            </span>
            <span className={cx(b.day, pop(s >= 6))}>{DAYS[i]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export const BUILDS = [
  {
    Component: BookCall,
    stages: [
      'display: inline-flex',
      'padding: 14px 28px',
      'background: var(--accent)',
      'border-radius: 12px',
      '{children}',
      '<Calendar />',
      '<Button variant="secondary" iconOnly />',
    ],
    code: `export function BookCall() {
  return (
    <Row gap={8}>
      <Button size="l" href="/book">
        <Calendar size={16} />
        Book a call
      </Button>
      <Button
        variant="secondary"
        size="l"
        iconOnly
        aria-label="Copy link"
      >
        <Link2 size={16} />
      </Button>
    </Row>
  )
}`,
  },
  {
    Component: ProfileCard,
    stages: [
      'width: 248px',
      'background: var(--slab)',
      '<Avatar initials="MC" />',
      '<Text weight={600} />',
      '<Meta icon={MapPin} />',
      '<Tag dot>Available</Tag>',
      '<Button size="s" />',
    ],
    code: `export function ProfileCard({ person }) {
  return (
    <Card width={248}>
      <Row justify="between">
        <Avatar initials={person.initials} online />
        <Tag dot>Available</Tag>
      </Row>
      <Text weight={600}>{person.name}</Text>
      <Text tone="muted">{person.title}</Text>
      <Meta icon={MapPin}>{person.city}</Meta>
      <Row gap={8}>
        <Button size="s">Message</Button>
        <Button size="s" variant="secondary">View profile</Button>
      </Row>
    </Card>
  )
}`,
  },
  {
    Component: Notifications,
    stages: [
      'padding: 6px',
      'background: var(--slab)',
      '<GroupHeader />',
      'background: var(--raise-1)',
      '<Switch />',
      'border-radius: 14px',
      '<Switch />',
    ],
    code: `export function Notifications() {
  const [prefs, setPrefs] = usePrefs()

  return (
    <Card padding={6}>
      <GroupHeader
        title="Notifications"
        help="Choose what reaches your inbox"
      />
      <Setting label="Product updates" help="Once a month">
        <Switch checked={prefs.updates} onChange={setPrefs.updates} />
      </Setting>
      <Setting label="Mentions" help="When someone tags you">
        <Switch checked={prefs.mentions} onChange={setPrefs.mentions} />
      </Setting>
    </Card>
  )
}`,
  },
  {
    Component: StatsCard,
    stages: [
      'border-radius: 20px',
      'background: var(--slab)',
      '<Label>Weekly visitors</Label>',
      'font-variant-numeric: tabular-nums',
      '<Delta value={0.182} />',
      '<Bars data={week} />',
      '<Axis labels={days} />',
    ],
    code: `export function StatsCard({ week }) {
  const total = useCountUp(sum(week))

  return (
    <Card radius={20}>
      <Label>Weekly visitors</Label>
      <Row align="baseline" gap={8}>
        <Metric value={total} />
        <Delta value={0.182} />
      </Row>
      <Bars data={week} highlight="max" tooltip />
      <Axis labels={days} />
    </Card>
  )
}`,
  },
]
