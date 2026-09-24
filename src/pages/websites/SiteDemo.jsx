import { useEffect, useRef, useState } from 'react'
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Check,
  FileText,
  Home,
  Layers,
  Lock,
  Maximize2,
  Menu,
  Settings,
  ShieldCheck,
  Sparkles,
  Wallet,
  Zap,
} from 'lucide-react'
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
import styles from './SiteDemo.module.css'

/*
 * A realistic website being made, as a motion-graphics loop: a browser opens,
 * the page appears as a grey wireframe, then fills in with real copy and a
 * product dashboard. After that it keeps being worked on — scrolled, resized
 * down to a phone (the layout genuinely reflows, via container queries),
 * re-branded and published — always coming back to where it started.
 *
 * The site is laid out at a fixed design size and scaled to fit, so it reads
 * like a real page shrunk down rather than a sketch of one.
 * "Lumen" is a made-up product.
 */

const W = 1040 // design width of the browser
const H = 640 // design height of the page viewport
const CHROME = 44

const INTRO = 4.8
const ACTIONS = [
  { name: 'scroll', dur: 4.4 },
  { name: 'resize', dur: 4.6 },
  { name: 'brand', dur: 3.8 },
  { name: 'publish', dur: 3.4 },
]
const LOOP = loopLength(ACTIONS)
const DOMAIN = 'lumenbooks.com'
const PHONE_W = 400

const BRANDS = ['#7c5cff', '#22c55e', '#f97316']
const PUBLISH = [W - 64, 22]
const REST = [W - 180, H - 60 + CHROME]

const HEADLINE = 'Bookkeeping that runs itself.'.split(' ')

// Revenue over twelve months, for the dashboard chart (0–1, higher is more)
const REVENUE = [0.32, 0.38, 0.35, 0.44, 0.42, 0.5, 0.56, 0.52, 0.63, 0.7, 0.68, 0.82]

function mixHex(a, b, k) {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16))
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16))
  const c = pa.map((v, i) => Math.round(lerp(v, pb[i], k)))
  return `rgb(${c.join(',')})`
}

/** The whole scene at time t: what's built, where the cursor is, what's changing. */
function sceneAt(t) {
  const st = {
    url: DOMAIN,
    siteW: W,
    scroll: 0,
    brand: BRANDS[0],
    cursor: REST,
    cursorIn: 1,
    press: 0,
    readout: null,
    palette: 0,
    swatch: 0,
    publish: 0, // 0 idle, 0–1 working, then done
    published: 0,
    toast: 0,
  }

  if (t < INTRO) {
    st.url = DOMAIN.slice(0, Math.round(DOMAIN.length * seg(t, 0.25, 0.9)))
    st.cursorIn = seg(t, 4.4, 4.8)
    return st
  }

  const [name, u] = actionAt(t - INTRO, ACTIONS)

  if (name === 'scroll') {
    // Wheel down past the dashboard to the features, pause, back to the top
    st.scroll = 560 * easeInOutCubic(seg(u, 0.3, 1.5)) * (1 - easeInOutCubic(seg(u, 2.7, 3.8)))
    st.cursor = track(u, [[0, ...REST], [0.3, REST[0] - 260, REST[1] - 180], [3.9, REST[0] - 260, REST[1] - 180], [4.3, ...REST]])
  }

  if (name === 'resize') {
    // Grab the window's right edge and drag it down to phone width, then back
    const narrow = easeInOutCubic(seg(u, 0.65, 1.7)) * (1 - easeInOutCubic(seg(u, 2.8, 3.85)))
    st.siteW = lerp(W, PHONE_W, narrow)
    const edge = [st.siteW - 2, CHROME + H / 2]
    st.cursor =
      u < 0.6
        ? track(u, [[0, ...REST], [0.55, W - 2, CHROME + H / 2]])
        : u < 3.9
          ? edge
          : track(u, [[3.9, W - 2, CHROME + H / 2], [4.5, ...REST]])
    st.press = u > 0.6 && u < 3.85 ? 0.6 : 0
    if (u > 0.6 && u < 3.9) st.readout = `${Math.round(st.siteW)} px`
  }

  if (name === 'brand') {
    // Open the palette, try two other brand colours, come back to the first
    st.palette = easeOutBack(seg(u, 0.1, 0.4), 1.8) * (1 - easeInBack(seg(u, 3.3, 3.6)))
    const clicks = [0.8, 1.8, 2.8]
    const pick = clicks.filter((c) => u >= c).length // 0..3
    const order = [0, 1, 2, 0]
    const from = order[Math.max(0, pick - 1)]
    const to = order[pick]
    const k = pick === 0 ? 0 : easeOutCubic(seg(u, clicks[pick - 1], clicks[pick - 1] + 0.45))
    st.brand = pick === 0 ? BRANDS[0] : mixHex(BRANDS[from], BRANDS[to], k)
    st.swatch = to
    // Matches .palette in the CSS: 200px in from the right, 72px down
    const swatchAt = (i) => [W - 121 + i * 34, CHROME + 93]
    st.cursor = track(u, [
      [0, ...REST],
      [0.7, ...swatchAt(1)],
      [1.7, ...swatchAt(2)],
      [2.7, ...swatchAt(0)],
      [3.0, ...swatchAt(0)],
      [3.7, ...REST],
    ])
    st.press = Math.max(...clicks.map((c) => bell(u, c, 0.09)))
  }

  if (name === 'publish') {
    st.cursor = track(u, [[0, ...REST], [0.45, ...PUBLISH], [0.9, ...PUBLISH], [1.4, ...REST]])
    st.press = bell(u, 0.5, 0.09)
    st.publish = seg(u, 0.55, 1.25)
    st.published = easeOutBack(seg(u, 1.25, 1.5), 2.2) * (1 - seg(u, 2.9, 3.2))
    st.toast = easeOutBack(seg(u, 1.3, 1.7), 1.6) * (1 - easeInBack(seg(u, 2.7, 3.1)))
  }

  return st
}

/** The revenue line and the area under it, drawn in as `k` goes 0 → 1. */
function RevenueChart({ k }) {
  const w = 420
  const h = 120
  const pts = REVENUE.map((v, i) => [(i / (REVENUE.length - 1)) * w, h - v * h])
  const line = `M${pts.map((p) => p.join(' ')).join(' L')}`
  const area = `${line} L${w} ${h} L0 ${h}Z`
  return (
    <svg className={styles.chart} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
      {[0.25, 0.5, 0.75].map((y) => (
        <line key={y} x1="0" x2={w} y1={h * y} y2={h * y} className={styles.gridLine} />
      ))}
      <path d={area} className={styles.area} style={{ clipPath: `inset(0 ${(1 - k) * 100}% 0 0)` }} />
      <path d={line} className={styles.line} pathLength="1" strokeDasharray="1" strokeDashoffset={1 - k} />
    </svg>
  )
}

export default function SiteDemo({ onMaximize }) {
  const [ref, t] = useTimeline({ intro: INTRO, loop: LOOP, still: INTRO + 0.2 })
  const boxRef = useRef(null)
  const [scale, setScale] = useState(0.6)

  // Fit the fixed-size design into whatever width the column gives it
  useEffect(() => {
    const el = boxRef.current
    if (!el) return undefined
    const ro = new ResizeObserver(([entry]) => setScale(entry.contentRect.width / W))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const st = sceneAt(t)

  // Build order: wireframe first, then each part fills in with real content
  const frame = easeOutBack(seg(t, 0, 0.45), 1.3)
  const wire = (at) => easeOutCubic(seg(t, at, at + 0.3))
  const fill = (at, d = 0.35) => easeOutCubic(seg(t, at, at + d))
  const pop = (at) => easeOutBack(seg(t, at, at + 0.35), 1.8)
  // A button is a grey block until its moment, then fills in with a small bump
  const bump = (at) => `scale(${1 + 0.08 * bell(t, at + 0.12, 0.14)})`
  const built = (at) => fill(at) >= 1

  /** Text that's a grey bar until it fills in, then fades to its real colour. */
  const skel = (f, rgb = '250,250,250') => ({
    color: f >= 1 ? undefined : `rgba(${rgb},${f})`,
    backgroundColor: f >= 1 ? undefined : `rgba(255,255,255,${0.08 * (1 - f)})`,
  })
  const MUTED = '161,161,170'

  const stats = [
    { label: 'Revenue', value: '$48,210', delta: '+12.4%', at: 3.2 },
    { label: 'Expenses', value: '$19,880', delta: '−3.1%', at: 3.3 },
    { label: 'Cash on hand', value: '$126,400', delta: '+8.9%', at: 3.4 },
  ]
  const txns = [
    { name: 'Stripe payout', amount: '+$3,240.00', at: 3.75 },
    { name: 'AWS', amount: '−$412.18', at: 3.85 },
    { name: 'Figma', amount: '−$45.00', at: 3.95 },
  ]
  const features = [
    { Icon: Zap, title: 'Automatic categorisation', text: 'Every transaction sorted the moment it lands.' },
    { Icon: FileText, title: 'Month-end in one click', text: 'Reconciled books and reports, ready for your accountant.' },
    { Icon: ShieldCheck, title: 'Bank-grade security', text: 'Read-only connections, encrypted end to end.' },
  ]

  return (
    <div ref={ref} className={styles.wrap}>
      <div ref={boxRef} className={styles.box} style={{ height: (CHROME + H) * scale }}>
        <div className={styles.stage} style={{ width: W, height: CHROME + H, transform: `scale(${scale})` }}>
          <div className={styles.popper} style={{ transform: `scale(${frame})`, opacity: clamp01(frame * 2) }}>
            <div className={styles.browser} style={{ width: st.siteW }}>
              {/* Browser chrome, with the builder's Publish button */}
              <div className={styles.chrome}>
                <span className={styles.dots}>
                  <i />
                  <i />
                  <i />
                </span>
                <span className={styles.address}>
                  <Lock size={11} className={st.published > 0.5 ? styles.lockLive : styles.lock} />
                  <span className={styles.urlText}>{st.url}</span>
                </span>
                {onMaximize && (
                  <button type="button" className={styles.maximize} onClick={onMaximize} aria-label="Open the full Lumen site">
                    <Maximize2 size={15} />
                  </button>
                )}
                <span className={styles.publish} style={{ transform: `scale(${1 - st.press * 0.08})` }}>
                  {st.published > 0.05 ? (
                    <>
                      <Check size={13} strokeWidth={3} /> Live
                    </>
                  ) : st.publish > 0 && st.publish < 1 ? (
                    <span className={styles.spinner} style={{ transform: `rotate(${st.publish * 720}deg)` }} />
                  ) : (
                    'Publish'
                  )}
                </span>
              </div>

              {/* The website itself */}
              <div className={styles.viewport} style={{ height: H }}>
                <div className={styles.site} style={{ '--brand': st.brand, transform: `translateY(${-st.scroll}px)` }}>
                  <div className={styles.navWrap}>
                    <nav className={styles.nav} style={{ opacity: wire(0.5) }}>
                      <span className={styles.logo} style={skel(fill(1.35))}>
                        <span className={styles.logoMark} style={{ transform: `scale(${pop(1.35)})` }}>
                          <Layers size={14} strokeWidth={2.5} />
                        </span>
                        Lumen
                      </span>
                      <span className={styles.links}>
                        {['Product', 'Pricing', 'Customers', 'Docs'].map((l, i) => (
                          <span key={l} style={skel(fill(1.4 + i * 0.05), MUTED)}>
                            {l}
                          </span>
                        ))}
                      </span>
                      <span className={styles.navRight}>
                        <span className={styles.signIn} style={skel(fill(1.6), MUTED)}>
                          Sign in
                        </span>
                        <span className={built(1.65) ? styles.btnLight : styles.btnSkel} style={{ transform: bump(1.65) }}>
                          Get started
                        </span>
                      </span>
                      <Menu className={styles.menuIcon} size={18} />
                    </nav>
                  </div>

                  <section className={styles.hero} style={{ opacity: wire(0.6) }}>
                    <span className={built(1.7) ? styles.badge : styles.badgeSkel} style={{ transform: bump(1.7) }}>
                      <span className={styles.badgeNew}>New</span>
                      Lumen AI reconciles in seconds
                      <ArrowRight size={13} />
                    </span>
                    <h1 className={styles.h1}>
                      {HEADLINE.map((word, i) => {
                        const k = fill(1.9 + i * 0.09, 0.3)
                        return (
                          <span key={i} className={styles.word} style={skel(k)}>
                            <span style={{ display: 'inline-block', transform: `translateY(${(1 - k) * 8}px)` }}>{word}</span>{' '}
                          </span>
                        )
                      })}
                    </h1>
                    <p className={styles.lede}>
                      <span style={skel(fill(2.4, 0.4), MUTED)}>
                        Lumen connects your bank, sorts every transaction and closes your books each month, so you can
                        get back to running the business.
                      </span>
                    </p>
                    <div className={styles.ctas}>
                      <span className={built(2.7) ? styles.btnBrand : styles.btnSkel} style={{ transform: bump(2.7) }}>
                        Start free trial <ArrowRight size={15} />
                      </span>
                      <span className={built(2.8) ? styles.btnGhost : styles.btnSkel} style={{ transform: bump(2.8) }}>
                        Book a demo
                      </span>
                    </div>
                  </section>

                  {/* Product shot: the app's dashboard, cut by the fold */}
                  <section className={styles.product} style={{ opacity: wire(0.75) }}>
                    <div className={styles.app}>
                      <aside className={styles.sidebar}>
                        {[Home, BarChart3, Wallet, FileText, Settings].map((Icon, i) => (
                          <span
                            key={i}
                            className={i === 1 ? styles.sideOn : styles.sideItem}
                            style={{ transform: `scale(${pop(3.0 + i * 0.05)})` }}
                          >
                            <Icon size={15} />
                          </span>
                        ))}
                      </aside>
                      <div className={styles.appMain}>
                        <div className={styles.stats}>
                          {stats.map((s) => (
                            <div key={s.label} className={styles.stat}>
                              <span className={styles.statLabel} style={skel(fill(s.at), MUTED)}>
                                {s.label}
                              </span>
                              <span className={styles.statValue} style={skel(fill(s.at + 0.1))}>
                                {s.value}
                              </span>
                              <span
                                className={s.delta.startsWith('+') ? styles.deltaUp : styles.deltaDown}
                                style={{ opacity: fill(s.at + 0.2) }}
                              >
                                {s.delta}
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className={styles.panels}>
                          <div className={styles.chartCard}>
                            <div className={styles.cardHead}>
                              <span style={skel(fill(3.5))}>Revenue</span>
                              <span className={styles.cardHint} style={skel(fill(3.55), MUTED)}>
                                Last 12 months
                              </span>
                            </div>
                            <RevenueChart k={easeInOutCubic(seg(t, 3.55, 4.4))} />
                          </div>
                          <div className={styles.txCard}>
                            <div className={styles.cardHead}>
                              <span style={skel(fill(3.7))}>Transactions</span>
                            </div>
                            {txns.map((x) => (
                              <div key={x.name} className={styles.tx}>
                                <span className={styles.txIcon} style={{ transform: `scale(${pop(x.at)})` }} />
                                <span className={styles.txName} style={skel(fill(x.at))}>
                                  {x.name}
                                </span>
                                <span
                                  className={x.amount.startsWith('+') ? styles.txIn : styles.txOut}
                                  style={skel(fill(x.at + 0.05), x.amount.startsWith('+') ? '74,222,128' : '250,250,250')}
                                >
                                  {x.amount}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Below the fold: only seen when the page is scrolled */}
                  <section className={styles.logos}>
                    <p className={styles.logosLabel}>Trusted by 2,000+ finance teams</p>
                    <div className={styles.logoRow}>
                      {['Northwind', 'Globex', 'Initech', 'Vandelay', 'Hooli'].map((n) => (
                        <span key={n}>{n}</span>
                      ))}
                    </div>
                  </section>
                  <section className={styles.features}>
                    {features.map(({ Icon, title, text }) => (
                      <article key={title} className={styles.feature}>
                        <span className={styles.featureIcon}>
                          <Icon size={17} />
                        </span>
                        <h3 className={styles.h3}>{title}</h3>
                        <p className={styles.featureText}>{text}</p>
                        <span className={styles.learn}>
                          Learn more <ArrowUpRight size={13} />
                        </span>
                      </article>
                    ))}
                  </section>
                  <footer className={styles.siteFooter}>
                    <span className={styles.logo}>
                      <span className={styles.logoMark}>
                        <Sparkles size={12} />
                      </span>
                      Lumen
                    </span>
                    <span>© 2026 Lumen Inc.</span>
                  </footer>
                </div>

                {/* Builder UI on top of the page */}
                {st.palette > 0.01 && (
                  <div className={styles.palette} style={{ transform: `scale(${st.palette})` }}>
                    <span className={styles.paletteLabel}>Brand</span>
                    {BRANDS.map((c, i) => (
                      <span key={c} className={`${styles.swatch} ${st.swatch === i ? styles.swatchOn : ''}`} style={{ background: c }} />
                    ))}
                  </div>
                )}
                {st.toast > 0.01 && (
                  <div className={styles.toast} style={{ transform: `translate(-50%, ${(1 - st.toast) * 24}px)`, opacity: clamp01(st.toast) }}>
                    <span className={styles.toastIcon}>
                      <Check size={14} strokeWidth={3} />
                    </span>
                    Live on <strong>{DOMAIN}</strong>
                  </div>
                )}
              </div>
            </div>

            {st.readout && (
              <span className={styles.readout} style={{ left: st.cursor[0] + 18, top: st.cursor[1] + 20 }}>
                {st.readout}
              </span>
            )}
            {st.cursorIn > 0.01 && (
              <svg
                className={styles.cursor}
                style={{
                  left: st.cursor[0],
                  top: st.cursor[1],
                  opacity: st.cursorIn,
                  transform: `scale(${1 - st.press * 0.16})`,
                }}
                width="22"
                height="22"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M3 2l17 9.2-7.6 1.9L8.7 21z" fill="#fff" stroke="#0b0b0b" strokeWidth="1.6" strokeLinejoin="round" />
              </svg>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
