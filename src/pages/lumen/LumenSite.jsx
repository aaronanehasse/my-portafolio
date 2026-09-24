import { useEffect, useRef, useState } from 'react'
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  Check,
  ChevronDown,
  CreditCard,
  FileSpreadsheet,
  FileText,
  Home,
  Landmark,
  Layers,
  Menu,
  MessageSquare,
  Plug,
  Settings,
  ShoppingBag,
  Sparkles,
  Users,
  Wallet,
  X,
} from 'lucide-react'
import { ClothField, DeckEmbers, RippleField } from '../../components'
import { actionAt, bell, easeOutCubic, loopLength, seg, track, useTimeline } from '../../lib/motion.js'
import { CashflowArt, CategoriseArt, CloseArt, PipelineArt, SecurityArt } from './art.jsx'
import styles from './LumenSite.module.css'

/*
 * Lumen: a complete, made-up product website, built as a real page to show the
 * kind of site the website service delivers. Everything works: the nav scrolls
 * to sections, the dashboard's period tabs and chart respond, pricing toggles
 * between monthly and yearly, the FAQ opens, the signup form submits, and the
 * layout reflows down to a phone.
 *
 * It moves the way the portfolio does: the hero sits on a rippling grid, a
 * demo cursor drives the dashboard until you take over, every feature has
 * its own motion-graphics illustration (art.jsx), data flows through the
 * how-it-works pipeline, numbers count up, the chart draws itself, new
 * transactions arrive live and the sign-up band ripples under the pointer.
 *
 * It sizes itself with container queries, not media queries, so it lays out
 * the same whether it fills a window (/demo/lumen) or sits inside the
 * portfolio's overlay. Inside a scrolling container marked
 * `data-scroll-root`, in-page links scroll that container instead of the page.
 */

const NAV = [
  { id: 'lumen-product', label: 'Product' },
  { id: 'lumen-how', label: 'How it works' },
  { id: 'lumen-pricing', label: 'Pricing' },
  { id: 'lumen-customers', label: 'Customers' },
  { id: 'lumen-faq', label: 'FAQ' },
]

const PERIODS = {
  '12M': {
    label: 'Last 12 months',
    points: [32, 38, 35, 44, 42, 50, 56, 52, 63, 70, 68, 82],
    ticks: ['Oct', 'Jan', 'Apr', 'Jul', 'Sep'],
    total: 482100,
  },
  '6M': {
    label: 'Last 6 months',
    points: [56, 52, 58, 63, 61, 70, 68, 74, 72, 79, 77, 82],
    ticks: ['Apr', 'May', 'Jul', 'Aug', 'Sep'],
    total: 276480,
  },
  '30D': {
    label: 'Last 30 days',
    points: [60, 64, 58, 66, 71, 63, 69, 74, 70, 77, 80, 82],
    ticks: ['1', '8', '15', '22', '30'],
    total: 48210,
  },
}

const TRANSACTIONS = [
  { name: 'Stripe payout', category: 'Revenue', amount: '+$3,240.00', inflow: true },
  { name: 'AWS', category: 'Software', amount: '−$412.18' },
  { name: 'Gusto payroll', category: 'Payroll', amount: '−$18,400.00' },
  { name: 'Figma', category: 'Software', amount: '−$45.00' },
]

// New transactions that arrive in the live feed, round-robin
const INCOMING = [
  { name: 'Shopify payout', category: 'Revenue', amount: '+$1,812.40', inflow: true },
  { name: 'Notion', category: 'Software', amount: '−$96.00' },
  { name: 'Stripe payout', category: 'Revenue', amount: '+$2,150.00', inflow: true },
  { name: 'Uber', category: 'Travel', amount: '−$38.20' },
  { name: 'WeWork', category: 'Rent', amount: '−$1,450.00' },
  { name: 'Client invoice #1042', category: 'Revenue', amount: '+$6,400.00', inflow: true },
]

const BRAND = '#7c5cff'
const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Counts from where it was to `value` whenever it's on screen and changes. */
function CountUp({ value, prefix = '', duration = 1100 }) {
  const ref = useRef(null)
  const shown = useRef(0)
  const [display, setDisplay] = useState(0)
  const [visible, setVisible] = useState(false)
  const [reduced] = useState(prefersReducedMotion)

  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setVisible(true), { threshold: 0.4 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (!visible || reduced) return undefined
    const from = shown.current
    const start = performance.now()
    let raf = 0
    const tick = (now) => {
      const k = Math.min(1, (now - start) / duration)
      const v = from + (value - from) * (1 - (1 - k) ** 3)
      shown.current = v
      setDisplay(v)
      if (k < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, visible, reduced, duration])

  return (
    <span ref={ref}>
      {prefix}
      {/* With reduced motion there's no count, just the number */}
      {Math.round(reduced ? value : display).toLocaleString('en-US')}
    </span>
  )
}

const STEPS = [
  {
    title: 'Connect your accounts',
    text: 'Link your bank, cards and payment processors in a couple of minutes. Read-only, always.',
    Icon: Plug,
  },
  {
    title: 'Lumen sorts everything',
    text: 'Each transaction is categorised, matched to receipts and flagged if something looks off.',
    Icon: Sparkles,
  },
  {
    title: 'Close the month',
    text: 'One click reconciles the books and sends clean reports straight to your accountant.',
    Icon: FileText,
  },
]

const INTEGRATIONS = [
  { name: 'Any bank', Icon: Landmark },
  { name: 'Stripe', Icon: CreditCard },
  { name: 'Shopify', Icon: ShoppingBag },
  { name: 'Gusto', Icon: Users },
  { name: 'Slack', Icon: MessageSquare },
  { name: 'Excel & CSV', Icon: FileSpreadsheet },
]

const QUOTES = [
  {
    quote: 'We used to lose the first week of every month to bookkeeping. Now it’s done before lunch on the 1st.',
    name: 'Priya Raman',
    role: 'COO, Northwind Studio',
  },
  {
    quote: 'Our accountant asked what changed. The reports just started arriving clean and on time.',
    name: 'Marcus Webb',
    role: 'Founder, Globex Supply',
  },
  {
    quote: 'The categorisation is scarily good. I fix maybe two transactions a month.',
    name: 'Elena Kovač',
    role: 'Finance lead, Initech',
  },
]

const PLANS = [
  {
    name: 'Starter',
    monthly: 29,
    blurb: 'For freelancers and solo founders.',
    features: ['1 bank connection', 'Automatic categorisation', 'Monthly reports'],
  },
  {
    name: 'Growth',
    monthly: 79,
    blurb: 'For small teams that want the month closed on day one.',
    features: ['Unlimited connections', 'One-click month-end close', 'Receipt matching', 'Accountant access'],
    featured: true,
  },
  {
    name: 'Scale',
    monthly: null,
    blurb: 'For companies with multiple entities.',
    features: ['Multi-entity books', 'Custom approval flows', 'SSO and audit log', 'Dedicated support'],
  },
]

const FAQ = [
  {
    q: 'Is my financial data safe?',
    a: 'Connections are read-only and encrypted in transit and at rest. Lumen can never move money.',
  },
  {
    q: 'Do I still need an accountant?',
    a: 'For taxes and advice, yes. Lumen does the bookkeeping so your accountant spends their time on what matters.',
  },
  {
    q: 'Can I switch from my current software?',
    a: 'Import your history from a CSV or export from most bookkeeping tools. It usually takes under an hour.',
  },
  {
    q: 'What happens after the free trial?',
    a: 'You pick a plan or your account pauses. Nothing is charged without you choosing a plan first.',
  },
]

/** Scroll to a section inside whatever is scrolling this page. */
function useSectionLinks() {
  return (id) => (e) => {
    e.preventDefault()
    const el = document.getElementById(id)
    if (!el) return
    const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
    const root = el.closest('[data-scroll-root]')
    const offset = 76 // clears the sticky nav
    if (root) {
      const top = root.scrollTop + el.getBoundingClientRect().top - root.getBoundingClientRect().top - offset
      root.scrollTo({ top, behavior })
    } else {
      window.scrollTo({ top: window.scrollY + el.getBoundingClientRect().top - offset, behavior })
    }
  }
}

function Chart({ period, demoHover = null, boxRef }) {
  const [own, setHover] = useState(null)
  // The visitor's own hover wins over the demo cursor's
  const hover = own ?? demoHover
  const data = PERIODS[period].points
  const w = 600
  const h = 180
  const max = 90
  const pts = data.map((v, i) => [(i / (data.length - 1)) * w, h - (v / max) * h])
  const line = `M${pts.map((p) => p.join(' ')).join(' L')}`
  const area = `${line} L${w} ${h} L0 ${h}Z`

  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    const i = Math.round(((e.clientX - r.left) / r.width) * (data.length - 1))
    setHover(Math.max(0, Math.min(data.length - 1, i)))
  }

  return (
    <div ref={boxRef} className={styles.chartWrap} data-reveal onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
      <svg className={styles.chart} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
        {[0.25, 0.5, 0.75].map((y) => (
          <line key={y} x1="0" x2={w} y1={h * y} y2={h * y} className={styles.gridLine} />
        ))}
        <path d={area} className={styles.area} />
        <path d={line} className={styles.line} pathLength="1" />
        {hover !== null && (
          <line x1={pts[hover][0]} x2={pts[hover][0]} y1="0" y2={h} className={styles.hoverLine} />
        )}
      </svg>
      {hover !== null && (
        <span
          className={styles.tooltip}
          style={{ left: `${(pts[hover][0] / w) * 100}%`, top: `${(pts[hover][1] / h) * 100}%` }}
        >
          ${(data[hover] * 588).toLocaleString('en-US')}
        </span>
      )}
      <div className={styles.ticks}>
        {PERIODS[period].ticks.map((t) => (
          <span key={t}>{t}</span>
        ))}
      </div>
    </div>
  )
}

// The dashboard demos itself: a cursor clicks through the periods, then
// scrubs across the chart. Moving your own pointer over it takes over.
const DEMO_INTRO = 0.8
const DEMO_ACTIONS = [
  { name: 'tabs', dur: 3.6 },
  { name: 'scrub', dur: 3.4 },
  { name: 'rest', dur: 1.4 },
]
const DEMO_LOOP = loopLength(DEMO_ACTIONS)
const TAB_ORDER = ['12M', '6M', '30D']

function Dashboard() {
  const [period, setPeriod] = useState('12M')
  const [feed, setFeed] = useState(() => TRANSACTIONS.map((x, i) => ({ ...x, key: `seed-${i}` })))
  const [ref, t] = useTimeline({ intro: DEMO_INTRO, loop: DEMO_LOOP, still: 0 })
  const [user, setUser] = useState(false)
  const [geo, setGeo] = useState(null)
  const tabRefs = useRef([])
  const chartRef = useRef(null)

  // Where the tabs and chart are inside the app, for the demo cursor
  useEffect(() => {
    const app = ref.current
    if (!app) return undefined
    const ro = new ResizeObserver(() => {
      const a = app.getBoundingClientRect()
      const rel = (el) => {
        const b = el.getBoundingClientRect()
        return { x: b.left - a.left, y: b.top - a.top, w: b.width, h: b.height }
      }
      setGeo({
        w: a.width,
        h: a.height,
        tabs: tabRefs.current.map((el) => {
          const b = rel(el)
          return [b.x + b.w / 2, b.y + b.h / 2]
        }),
        chart: rel(chartRef.current),
      })
    })
    ro.observe(app)
    return () => ro.disconnect()
  }, [ref])

  let demo = null
  if (!user && geo && !prefersReducedMotion() && t >= DEMO_INTRO) {
    const [name, u] = actionAt(t - DEMO_INTRO, DEMO_ACTIONS)
    const rest = [geo.w - 48, geo.h - 36]
    const tab = (p) => geo.tabs[Object.keys(PERIODS).indexOf(p)]
    demo = { cursor: rest, press: 0, ripple: null, period: '12M', hover: null }
    if (name === 'tabs') {
      const clicks = [0.7, 1.7, 2.7]
      demo.cursor = track(u, [[0.05, ...rest], [0.6, ...tab('6M')], [1.6, ...tab('30D')], [2.6, ...tab('12M')], [3.4, ...rest]])
      demo.press = Math.max(...clicks.map((c) => bell(u, c, 0.09)))
      const step = clicks.filter((c) => u >= c).length
      demo.period = TAB_ORDER[step % 3]
      const last = clicks[step - 1]
      if (last !== undefined && u - last < 0.5) demo.ripple = { at: tab(demo.period), k: (u - last) / 0.5 }
    }
    if (name === 'scrub') {
      // Across the chart, riding the line, with the tooltip following
      const c = geo.chart
      const pts = PERIODS['12M'].points
      const sweep = easeOutCubic(seg(u, 0.5, 2.6))
      const i = Math.round(sweep * (pts.length - 1))
      const onLine = (k) => {
        const f = k * (pts.length - 1)
        const a = pts[Math.floor(f)]
        const b = pts[Math.min(pts.length - 1, Math.floor(f) + 1)]
        const v = a + (b - a) * (f - Math.floor(f))
        return [c.x + k * c.w, c.y + 180 - (v / 90) * 180]
      }
      const start = onLine(0.02)
      const end = onLine(0.98)
      demo.cursor =
        u < 0.5
          ? track(u, [[0.05, ...rest], [0.45, ...start]])
          : u < 2.7
            ? onLine(0.02 + 0.96 * sweep)
            : track(u, [[2.7, ...end], [3.3, ...rest]])
      demo.hover = u > 0.5 && u < 2.75 ? i : null
    }
  }
  const shownPeriod = demo ? demo.period : period

  // Live feed: while the dashboard is on screen, a new transaction lands
  // every few seconds and the oldest drops off the bottom
  useEffect(() => {
    const el = ref.current
    if (!el || prefersReducedMotion()) return undefined
    let timer = 0
    let n = 0
    const tick = () => {
      const next = INCOMING[n % INCOMING.length]
      n += 1
      setFeed((f) => [{ ...next, key: `live-${n}`, fresh: true }, ...f.map((x) => ({ ...x, fresh: false }))].slice(0, 4))
    }
    const io = new IntersectionObserver(([e]) => {
      clearInterval(timer)
      if (e.isIntersecting) timer = setInterval(tick, 3200)
    })
    io.observe(el)
    return () => {
      clearInterval(timer)
      io.disconnect()
    }
  }, [ref])

  return (
    <div
      ref={ref}
      className={styles.app}
      // Your pointer takes over from the demo, starting where it left off
      onPointerEnter={() => {
        if (demo) setPeriod(demo.period)
        setUser(true)
      }}
      onPointerLeave={() => setUser(false)}
    >
      <aside className={styles.sidebar} aria-label="App navigation">
        {[Home, BarChart3, Wallet, FileText, Settings].map((Icon, i) => (
          <span key={i} className={i === 1 ? styles.sideOn : styles.sideItem}>
            <Icon size={16} />
          </span>
        ))}
      </aside>
      <div className={styles.appMain}>
        <div className={styles.appTop}>
          <div>
            <p className={styles.appKicker}>Overview</p>
            <p className={styles.appTitle}>Good morning, Priya</p>
          </div>
          <span className={styles.appTopRight}>
            <span className={demo ? styles.demoTag : `${styles.demoTag} ${styles.demoTagHidden}`}>
              Auto demo · hover to try it
            </span>
            <span className={styles.appBell}>
              <Bell size={16} />
            </span>
          </span>
        </div>
        <div className={styles.stats}>
          {[
            ['Revenue', PERIODS[shownPeriod].total, '+12.4%', true],
            ['Expenses', 19880, '−3.1%', false],
            ['Cash on hand', 126400, '+8.9%', true],
          ].map(([label, value, delta, up]) => (
            <div key={label} className={styles.stat}>
              <span className={styles.statLabel}>{label}</span>
              <span className={styles.statValue}>
                <CountUp value={value} prefix="$" />
              </span>
              <span className={up ? styles.up : styles.down}>{delta}</span>
            </div>
          ))}
        </div>
        <div className={styles.panels}>
          <div className={styles.panel}>
            <div className={styles.panelHead}>
              <span>
                Revenue <span className={styles.hint}>· {PERIODS[shownPeriod].label}</span>
              </span>
              <span className={styles.tabs} role="group" aria-label="Period">
                {Object.keys(PERIODS).map((p, i) => (
                  <button
                    key={p}
                    ref={(el) => {
                      tabRefs.current[i] = el
                    }}
                    type="button"
                    className={p === shownPeriod ? styles.tabOn : styles.tab}
                    aria-pressed={p === shownPeriod}
                    onClick={() => setPeriod(p)}
                  >
                    {p}
                  </button>
                ))}
              </span>
            </div>
            <Chart period={shownPeriod} demoHover={demo?.hover ?? null} boxRef={chartRef} />
          </div>
          <div className={styles.panel}>
            <div className={styles.panelHead}>
              <span>Transactions</span>
              <span className={styles.live}>
                <i className={styles.liveDot} /> Live
              </span>
            </div>
            <ul className={styles.txList} aria-live="polite">
              {feed.map((x) => (
                <li key={x.key} className={x.fresh ? `${styles.tx} ${styles.txFresh}` : styles.tx}>
                  <span className={styles.txIcon}>{x.name[0]}</span>
                  <span className={styles.txText}>
                    <span className={styles.txName}>{x.name}</span>
                    <span className={styles.txCat}>{x.category}</span>
                  </span>
                  <span className={x.inflow ? styles.txIn : styles.txOut}>{x.amount}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        {demo && (
          <svg className={styles.demoLayer} aria-hidden="true">
            {demo.ripple && (
              <circle
                className={styles.demoRipple}
                cx={demo.ripple.at[0]}
                cy={demo.ripple.at[1]}
                r={4 + 16 * easeOutCubic(demo.ripple.k)}
                opacity={1 - demo.ripple.k}
              />
            )}
            <g transform={`translate(${demo.cursor[0]} ${demo.cursor[1]}) scale(${1 - demo.press * 0.18})`}>
              <path className={styles.demoCursor} d="M0 0l15 8-6.6 1.7L5.2 16.5z" />
            </g>
          </svg>
        )}
      </div>
    </div>
  )
}

function Faq() {
  const [open, setOpen] = useState(0)
  return (
    <div className={styles.faqList}>
      {FAQ.map((item, i) => {
        const isOpen = open === i
        return (
          <div key={item.q} className={styles.faqItem}>
            <button
              type="button"
              className={styles.faqQ}
              aria-expanded={isOpen}
              aria-controls={`lumen-faq-${i}`}
              onClick={() => setOpen(isOpen ? -1 : i)}
            >
              {item.q}
              <ChevronDown size={18} className={isOpen ? styles.chevOpen : styles.chev} />
            </button>
            <div id={`lumen-faq-${i}`} className={isOpen ? styles.faqAOpen : styles.faqA} inert={!isOpen}>
              <p>{item.a}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function Signup() {
  const [email, setEmail] = useState('')
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const submit = (e) => {
    e.preventDefault()
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError('Enter a valid work email.')
      return
    }
    setError('')
    setDone(true)
  }

  if (done) {
    return (
      <p className={styles.signupDone} role="status">
        <Check size={18} strokeWidth={3} /> You’re in. Check {email} for your invite.
      </p>
    )
  }

  return (
    <form className={styles.signup} onSubmit={submit} noValidate>
      <label className={styles.srOnly} htmlFor="lumen-email">
        Work email
      </label>
      <input
        id="lumen-email"
        className={styles.input}
        type="email"
        placeholder="you@company.com"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value)
          setError('')
        }}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? 'lumen-email-error' : undefined}
      />
      <button type="submit" className={styles.btnLight}>
        Start free trial
      </button>
      {error && (
        <p id="lumen-email-error" className={styles.signupError}>
          {error}
        </p>
      )}
    </form>
  )
}

export default function LumenSite() {
  const go = useSectionLinks()
  const [menu, setMenu] = useState(false)
  const [yearly, setYearly] = useState(false)
  const topRef = useRef(null)

  // Scroll reveal: anything marked data-reveal slides in the first time it's
  // seen (works inside the overlay's scroller too). Delays come from --d.
  useEffect(() => {
    const root = topRef.current
    if (!root) return undefined
    const els = root.querySelectorAll('[data-reveal]')
    if (prefersReducedMotion()) {
      els.forEach((el) => el.setAttribute('data-shown', ''))
      return undefined
    }
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (!e.isIntersecting) return
          e.target.setAttribute('data-shown', '')
          io.unobserve(e.target)
        }),
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  /** Reveal props, with a stagger delay in ms. */
  const rv = (delay = 0) => ({ 'data-reveal': '', style: { '--d': `${delay}ms` } })

  return (
    <div className={styles.root} ref={topRef}>
      <div className={styles.navWrap}>
        <nav className={styles.nav} aria-label="Lumen">
          <a className={styles.logo} href="#lumen-top" onClick={go('lumen-top')}>
            <span className={styles.logoMark}>
              <Layers size={15} strokeWidth={2.5} />
            </span>
            Lumen
          </a>
          <span className={styles.links}>
            {NAV.map((n) => (
              <a key={n.id} href={`#${n.id}`} onClick={go(n.id)}>
                {n.label}
              </a>
            ))}
          </span>
          <span className={styles.navRight}>
            <a className={styles.signIn} href="#lumen-signup" onClick={go('lumen-signup')}>
              Sign in
            </a>
            <a className={styles.btnLight} href="#lumen-signup" onClick={go('lumen-signup')}>
              Get started
            </a>
          </span>
          <button
            type="button"
            className={styles.menuButton}
            aria-expanded={menu}
            aria-controls="lumen-menu"
            aria-label={menu ? 'Close menu' : 'Open menu'}
            onClick={() => setMenu(!menu)}
          >
            {menu ? <X size={18} /> : <Menu size={18} />}
          </button>
        </nav>
        {menu && (
          <div id="lumen-menu" className={styles.mobileMenu}>
            {NAV.map((n) => (
              <a
                key={n.id}
                href={`#${n.id}`}
                onClick={(e) => {
                  setMenu(false)
                  go(n.id)(e)
                }}
              >
                {n.label}
              </a>
            ))}
            <a className={styles.btnLight} href="#lumen-signup" onClick={(e) => { setMenu(false); go('lumen-signup')(e) }}>
              Get started
            </a>
          </div>
        )}
      </div>

      <header id="lumen-top" className={styles.hero}>
        <ClothField className={styles.heroField} color="rgba(255, 255, 255, 0.07)" glow={BRAND} every={4} reach={460} />
        <a className={styles.badge} href="#lumen-product" onClick={go('lumen-product')} {...rv(0)}>
          <span className={styles.badgeNew}>New</span>
          Lumen AI reconciles in seconds
          <ArrowRight size={13} />
        </a>
        <h1 className={styles.h1}>
          {'Bookkeeping that runs itself.'.split(' ').map((word, i) => (
            <span key={i} className={styles.word} {...rv(120 + i * 90)}>
              {word}{' '}
            </span>
          ))}
        </h1>
        <p className={styles.lede} {...rv(520)}>
          Lumen connects your bank, sorts every transaction and closes your books each month, so you can get back to
          running the business.
        </p>
        <div className={styles.ctas} {...rv(640)}>
          <a className={styles.btnBrand} href="#lumen-signup" onClick={go('lumen-signup')}>
            Start free trial <ArrowRight size={16} />
          </a>
          <a className={styles.btnGhost} href="#lumen-how" onClick={go('lumen-how')}>
            See how it works
          </a>
        </div>
        <p className={styles.fine} {...rv(760)}>
          14-day free trial · No card required
        </p>
      </header>

      <section className={styles.product} aria-label="Product preview">
        <div className={styles.appWrap} {...rv(820)}>
          {/* Sparks shed off the dashboard's rim; measures the dashboard, its next sibling */}
          <DeckEmbers color={BRAND} radius={20} pad={48} rate={4} />
          <Dashboard />
        </div>
      </section>

      <section className={styles.logos} aria-label="Customers">
        <p className={styles.logosLabel} {...rv()}>
          Trusted by 2,000+ finance teams
        </p>
        <div className={styles.logoRow}>
          {['Northwind', 'Globex', 'Initech', 'Vandelay', 'Hooli', 'Umbrella'].map((n, i) => (
            <span key={n} {...rv(i * 70)}>
              {n}
            </span>
          ))}
        </div>
      </section>

      <section id="lumen-product" className={styles.section}>
        <div className={styles.sectionHead} {...rv()}>
          <p className={styles.kicker}>Product</p>
          <h2 className={styles.h2}>Everything your books need. Nothing they don’t.</h2>
        </div>
        <div className={styles.bento}>
          <article className={`${styles.card} ${styles.cardWide}`} {...rv(0)}>
            <div className={styles.cardArt}>
              <CategoriseArt />
            </div>
            <h3 className={styles.h3}>Automatic categorisation</h3>
            <p className={styles.cardText}>Every transaction sorted the moment it lands, and it learns from every fix you make.</p>
          </article>
          <article className={styles.card} {...rv(100)}>
            <div className={styles.cardArt}>
              <CloseArt />
            </div>
            <h3 className={styles.h3}>Month-end in one click</h3>
            <p className={styles.cardText}>Reconciled books and reports, sent to your accountant.</p>
          </article>
          <article className={styles.card} {...rv(0)}>
            <div className={styles.cardArt}>
              <SecurityArt />
            </div>
            <h3 className={styles.h3}>Bank-grade security</h3>
            <p className={styles.cardText}>Read-only connections, encrypted end to end. Lumen can look, never touch.</p>
          </article>
          <article className={`${styles.card} ${styles.cardWide}`} {...rv(100)}>
            <div className={styles.cardArt}>
              <CashflowArt />
            </div>
            <h3 className={styles.h3}>Cash flow, in real time</h3>
            <p className={styles.cardText}>What’s coming in and going out, day by day, not at the end of the quarter.</p>
          </article>
        </div>
      </section>

      <section id="lumen-how" className={styles.section}>
        <div className={styles.sectionHead} {...rv()}>
          <p className={styles.kicker}>How it works</p>
          <h2 className={styles.h2}>Set up in minutes. Closed every month.</h2>
        </div>
        <div className={styles.pipeline} {...rv()}>
          <PipelineArt />
        </div>
        <ol className={styles.steps}>
          {STEPS.map(({ title, text }, i) => (
            <li key={title} className={styles.step} {...rv(i * 110)}>
              <span className={styles.stepNum}>{String(i + 1).padStart(2, '0')}</span>
              <h3 className={styles.h3}>{title}</h3>
              <p className={styles.cardText}>{text}</p>
            </li>
          ))}
        </ol>
        <div className={styles.integrations}>
          <p className={styles.logosLabel} {...rv()}>
            Works with the tools you already use
          </p>
          {/* Endless strip: the list twice, sliding by exactly one copy */}
          <div className={styles.marquee} {...rv(100)}>
            <div className={styles.marqueeTrack}>
              {[0, 1].map((copy) => (
                <div key={copy} className={styles.integrationRow} aria-hidden={copy === 1 || undefined}>
                  {INTEGRATIONS.map(({ name, Icon }) => (
                    <span key={name} className={styles.integration}>
                      <Icon size={15} /> {name}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="lumen-customers" className={styles.section}>
        <div className={styles.sectionHead} {...rv()}>
          <p className={styles.kicker}>Customers</p>
          <h2 className={styles.h2}>Teams that got their first week back.</h2>
        </div>
        <div className={styles.quotes}>
          {QUOTES.map((q, i) => (
            <figure key={q.name} className={styles.quote} {...rv(i * 110)}>
              <blockquote>“{q.quote}”</blockquote>
              <figcaption>
                <span className={styles.avatar}>
                  {q.name
                    .split(' ')
                    .map((p) => p[0])
                    .join('')}
                </span>
                <span>
                  <strong>{q.name}</strong>
                  <span className={styles.role}>{q.role}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section id="lumen-pricing" className={styles.section}>
        <div className={styles.sectionHead} {...rv()}>
          <p className={styles.kicker}>Pricing</p>
          <h2 className={styles.h2}>Simple plans that grow with you.</h2>
          <div className={styles.billing} role="group" aria-label="Billing period">
            <button type="button" className={!yearly ? styles.billOn : styles.bill} aria-pressed={!yearly} onClick={() => setYearly(false)}>
              Monthly
            </button>
            <button type="button" className={yearly ? styles.billOn : styles.bill} aria-pressed={yearly} onClick={() => setYearly(true)}>
              Yearly <span className={styles.save}>−20%</span>
            </button>
          </div>
        </div>
        <div className={styles.plans}>
          {PLANS.map((plan, i) => (
            <article key={plan.name} className={plan.featured ? styles.planFeatured : styles.plan} {...rv(i * 110)}>
              <div className={styles.planHead}>
                <h3 className={styles.h3}>{plan.name}</h3>
                {plan.featured && <span className={styles.popular}>Most popular</span>}
              </div>
              <p className={styles.cardText}>{plan.blurb}</p>
              <p className={styles.price}>
                {plan.monthly === null ? (
                  'Custom'
                ) : (
                  <>
                    {/* Keyed on the billing period, so a toggle replays the pop */}
                    <span key={yearly ? 'y' : 'm'} className={styles.priceValue}>
                      ${yearly ? Math.round(plan.monthly * 0.8) : plan.monthly}
                    </span>
                    <span className={styles.per}>/ month{yearly ? ', billed yearly' : ''}</span>
                  </>
                )}
              </p>
              <a
                className={plan.featured ? styles.btnBrand : styles.btnGhost}
                href="#lumen-signup"
                onClick={go('lumen-signup')}
              >
                {plan.monthly === null ? 'Talk to sales' : 'Start free trial'}
              </a>
              <ul className={styles.planFeatures}>
                {plan.features.map((f) => (
                  <li key={f}>
                    <Check size={15} strokeWidth={2.5} /> {f}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section id="lumen-faq" className={`${styles.section} ${styles.faqSection}`}>
        <div className={styles.sectionHead} {...rv()}>
          <p className={styles.kicker}>FAQ</p>
          <h2 className={styles.h2}>Questions, answered.</h2>
        </div>
        <div {...rv(100)}>
          <Faq />
        </div>
      </section>

      <section id="lumen-signup" className={styles.cta} {...rv()}>
        {/* The band ripples under the pointer */}
        <RippleField className={styles.ctaField} color={BRAND} restColor="rgba(255, 255, 255, 0.07)" gap={24} />
        <div className={styles.ctaContent}>
          <h2 className={styles.ctaTitle}>Close your books before lunch.</h2>
          <p className={styles.lede}>Start your 14-day free trial. Set up takes about five minutes.</p>
          <Signup />
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerCols}>
          <div className={styles.footerBrand}>
            <span className={styles.logo}>
              <span className={styles.logoMark}>
                <Layers size={13} strokeWidth={2.5} />
              </span>
              Lumen
            </span>
            <p className={styles.cardText}>Bookkeeping that runs itself.</p>
          </div>
          {[
            ['Product', ['Features', 'Pricing', 'Integrations', 'Changelog']],
            ['Company', ['About', 'Customers', 'Careers', 'Press']],
            ['Resources', ['Docs', 'Guides', 'Help center', 'Status']],
          ].map(([title, items]) => (
            <div key={title} className={styles.footerCol}>
              <p className={styles.footerTitle}>{title}</p>
              {items.map((item) => (
                <a key={item} href="#lumen-top" onClick={go('lumen-top')}>
                  {item}
                </a>
              ))}
            </div>
          ))}
        </div>
        <div className={styles.footerBottom}>
          <span>© 2026 Lumen Inc. A demo site by Aaron Anehasse.</span>
          <a href="/services/websites" className={styles.madeBy}>
            Want a site like this? <ArrowUpRight size={14} />
          </a>
        </div>
      </footer>
    </div>
  )
}
