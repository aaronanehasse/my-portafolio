import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, Send } from 'lucide-react'
import { Button, Card } from '../../components'
import useFormSender from '../../hooks/useFormSender.jsx'
import { useT } from '../../i18n/index.jsx'
import SiteLayout from '../../layout/SiteLayout.jsx'
import { BUDGET_UNSURE, budgetsFor, kindIds, labelOf } from './options.js'
import { DetailsStep, ProjectStep, ReviewStep, TypeStep, YouStep } from './steps.jsx'
import { summarize } from './summary.js'
import styles from './ContactPage.module.css'

/*
 * /contact — start a project, one step at a time. Pick a type, describe it,
 * add the details that type needs, leave your details, review, send.
 *
 * The draft is kept in this browser as you go, so leaving and coming back
 * picks up where you were. Links can preselect a type:
 *   /contact?type=website&preview=1   website, free preview ticked
 *   /contact?type=components | mobile | other
 */

// Their words are in the language files (contact.steps)
const STEPS = 5
const LAST = STEPS - 1


const blank = () => ({
  startedAt: Date.now(), // when this request was begun; kept with the draft (see useFormSender)
  kind: '',
  title: '',
  description: '',
  website: {
    business: '',
    current: '',
    preview: true,
    theme: 'dark',
    pages: [],
    features: [],
    colors: { primary: '', secondary: '', accent: '' }, // empty until chosen
    style: '',
    logo: '',
    text: '',
    photos: '',
    references: [],
    care: [],
  },
  components: {
    types: [],
    typesOther: '',
    stacks: [],
    stackOther: '',
    styling: '',
    language: '',
    design: '',
    scope: '',
    references: [],
  },
  mobile: { platform: '', stage: '', features: [], design: '', backend: '', extras: [] },
  other: { links: [] },
  timeline: '',
  budget: '',
  name: '',
  email: '',
  company: '',
})

// Bumped when the draft's shape changes, so an old draft can't feed the new form the wrong types
const DRAFT_KEY = 'project-draft-v4'
const KIND_ALIASES = { websites: 'website', web: 'website', app: 'mobile' }

/** Errors that stop you leaving a step, keyed by field, in the current language. */
function validate(step, s, t) {
  const e = {}
  const say = (key) => t(`contact.errors.${key}`)
  if (step === 0 && !s.kind) e.kind = say('kind')
  if (step === 1) {
    if (!s.title.trim()) e.title = say('title')
    if (s.description.trim().length < 10) e.description = say('description')
  }
  if (step === 2) {
    if (s.kind === 'website' && !s.website.business.trim()) e.business = say('business')
    if (s.kind === 'components') {
      const c = s.components
      if (!c.types.length && !c.typesOther.trim()) e.types = say('pickOne')
      if (!c.stacks.length && !c.stackOther.trim()) e.stacks = say('pickOne')
    }
    if (s.kind === 'mobile' && !s.mobile.platform) e.platform = say('platform')
  }
  if (step === 3) {
    if (!s.name.trim()) e.name = say('name')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.email.trim())) e.email = say('email')
  }
  return e
}

/** The saved draft (if any), with a ?type= link applied on top. */
function initial() {
  let saved = null
  try {
    saved = JSON.parse(localStorage.getItem(DRAFT_KEY))
  } catch {
    // No storage (private mode, blocked): start fresh
  }
  const fresh = blank()
  // Merge group by group, so a draft saved before a field existed still gets it
  const s = saved?.s
    ? {
        ...fresh,
        ...saved.s,
        website: { ...fresh.website, ...saved.s.website },
        components: { ...fresh.components, ...saved.s.components },
        mobile: { ...fresh.mobile, ...saved.s.mobile },
        other: { ...fresh.other, ...saved.s.other },
        // A draft saved before start times were kept was begun earlier than now, whenever that was
        startedAt: saved.s.startedAt ?? 0,
      }
    : fresh
  let step = saved?.step ?? 0
  let reached = saved?.reached ?? step

  const params = new URLSearchParams(window.location.search)
  const type = KIND_ALIASES[params.get('type')] ?? params.get('type')
  if (kindIds.includes(type)) {
    s.kind = type
    // A saved budget from another type's ranges doesn't carry over
    if (s.budget && s.budget !== BUDGET_UNSURE && !budgetsFor(type).includes(s.budget)) s.budget = ''
    if (type === 'website' && params.has('preview')) s.website.preview = params.get('preview') !== '0'
    step = 1
    reached = Math.max(reached, 1)
    // Applied once: a reload shouldn't send you back to step 2. Other parameters (?lang=) stay.
    const url = new URL(window.location.href)
    url.searchParams.delete('type')
    url.searchParams.delete('preview')
    history.replaceState(history.state, '', url.pathname + url.search + url.hash)
  }
  return { s, step: Math.min(step, LAST), reached: Math.min(reached, LAST) }
}

export default function ContactPage() {
  const { t, lang } = useT()
  const steps = t('contact.steps')
  const [init] = useState(initial)
  const [s, setS] = useState(init.s)
  const [step, setStep] = useState(init.step)
  const [reached, setReached] = useState(init.reached)
  const [errors, setErrors] = useState({})
  const [direction, setDirection] = useState(1)
  // Once they've changed anything, say the draft is being kept (it's saved from the first keystroke)
  const [touched, setTouched] = useState(false)
  const { send, status, setStatus, honeypot } = useFormSender('project')
  const headingRef = useRef(null)
  const topRef = useRef(null)
  const formRef = useRef(null)
  const moved = useRef(false)

  const set = (patch) => {
    setTouched(true)
    setS((prev) => ({ ...prev, ...patch }))
    setErrors((prev) => {
      const next = { ...prev }
      for (const key of Object.keys(patch)) delete next[key]
      return next
    })
    if (status === 'error') setStatus('idle')
  }
  const setIn = (group, patch) => {
    setTouched(true)
    setS((prev) => ({ ...prev, [group]: { ...prev[group], ...patch } }))
    setErrors((prev) => {
      const next = { ...prev }
      for (const key of Object.keys(patch)) delete next[key]
      return next
    })
  }

  // Keep the draft as they go; drop it once it's sent
  useEffect(() => {
    try {
      if (status === 'sent') localStorage.removeItem(DRAFT_KEY)
      else localStorage.setItem(DRAFT_KEY, JSON.stringify({ s, step, reached }))
    } catch {
      // Storage unavailable: the form still works, it just won't remember
    }
  }, [s, step, reached, status])

  // A new step: bring its top into view and move focus to its heading
  useEffect(() => {
    if (!moved.current) return
    const top = topRef.current?.getBoundingClientRect().top ?? 0
    if (top < 80) {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      window.scrollBy({ top: top - 96, behavior: reduce ? 'auto' : 'smooth' })
    }
    headingRef.current?.focus({ preventScroll: true })
  }, [step, status])

  const goTo = (next) => {
    moved.current = true
    setDirection(next > step ? 1 : -1)
    setErrors({})
    setStep(next)
    setReached((r) => Math.max(r, next))
  }

  const onNext = async (e) => {
    e.preventDefault()
    if (status === 'sending') return
    const found = validate(step, s, t)
    setErrors(found)
    if (Object.keys(found).length) {
      // Bring the first problem into view (it can be far down on a phone) once it's rendered
      requestAnimationFrame(() => {
        const first = formRef.current?.querySelector('[aria-invalid="true"], [data-error], [role="alert"]')
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        first?.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' })
        if (first?.matches('input, textarea')) first.focus({ preventScroll: true })
      })
      return
    }
    if (step < LAST) return goTo(step + 1)

    moved.current = true
    await send(
      {
        kind: s.kind,
        title: s.title.trim(),
        preview: s.kind === 'website' && s.website.preview,
        name: s.name.trim(),
        email: s.email.trim(),
        lang,
        sections: summarize(s, t),
      },
      { startedAt: s.startedAt },
    )
  }

  const restart = () => {
    moved.current = true
    setS(blank())
    setStep(0)
    setReached(0)
    setErrors({})
    setStatus('idle')
  }

  const stepClass = { current: styles.stepCurrent, done: styles.stepDone, todo: styles.stepTodo }
  const { label, title, intro } = steps[step]
  const Body = [TypeStep, ProjectStep, DetailsStep, YouStep, ReviewStep][step]
  const previewing = s.kind === 'website' && s.website.preview

  return (
    <SiteLayout current="contact">
      <div ref={topRef} className={styles.layout}>
        <aside className={styles.side}>
          <h1 className={styles.pageTitle}>{t('contact.title')}</h1>
          <p className={styles.pageIntro}>{t('contact.intro')}</p>

          {status !== 'sent' && (
            <ol className={styles.stepper} aria-label={t('contact.stepsLabel')}>
              {steps.map((st, i) => {
                const state = i === step ? 'current' : i <= reached ? 'done' : 'todo'
                return (
                  <li key={st.label}>
                    <button
                      type="button"
                      className={`${styles.stepLink} ${stepClass[state]}`}
                      onClick={() => goTo(i)}
                      disabled={i > reached || i === step}
                      aria-current={i === step ? 'step' : undefined}
                    >
                      <span className={styles.stepDot} aria-hidden="true">
                        {state === 'done' ? <Check size={13} strokeWidth={3} /> : i + 1}
                      </span>
                      <span className={styles.stepName}>{st.label}</span>
                      {i === 0 && s.kind && i !== step && <span className={styles.stepValue}>{labelOf(t, 'kinds', s.kind)}</span>}
                    </button>
                  </li>
                )
              })}
            </ol>
          )}
        </aside>

        <Card className={styles.card}>
          {status === 'sent' ? (
            <div className={styles.done} role="status">
              <span className={styles.doneIcon}>
                <Check size={26} strokeWidth={3} />
              </span>
              <h2 ref={headingRef} tabIndex={-1} className={styles.stepTitle}>
                {t('contact.sent.title')}
              </h2>
              <p className={styles.stepIntro}>{previewing ? t('contact.sent.preview') : t('contact.sent.quote')}</p>
              <p className={styles.muted}>{t('contact.sent.copy', { email: s.email })}</p>
              <div className={styles.doneActions}>
                <Button href="/">{t('contact.sent.home')}</Button>
                <Button variant="secondary" onClick={restart}>
                  {t('contact.sent.another')}
                </Button>
              </div>
            </div>
          ) : (
            <form ref={formRef} className={styles.form} onSubmit={onNext} noValidate>
              {honeypot}
              <div className={styles.progress}>
                <span className={styles.progressRow}>
                  <span aria-hidden="true">{t('contact.progress', { n: step + 1, total: STEPS, label })}</span>
                  {touched && (
                    <span className={styles.saved}>
                      <Check size={13} strokeWidth={3} aria-hidden="true" /> {t('contact.saved')}
                    </span>
                  )}
                </span>
                <span className={styles.bar}>
                  <span className={styles.barFill} style={{ width: `${((step + 1) / STEPS) * 100}%` }} />
                </span>
              </div>

              <div key={step} className={styles.stepBody} data-direction={direction > 0 ? 'forward' : 'back'}>
                <div className={styles.stepHead}>
                  <h2 ref={headingRef} tabIndex={-1} className={styles.stepTitle}>
                    {title}
                  </h2>
                  <p className={styles.stepIntro}>{intro}</p>
                </div>
                <Body s={s} set={set} setIn={setIn} errors={errors} goTo={goTo} />
                {errors.kind && (
                  <p className={styles.error} role="alert">
                    {errors.kind}
                  </p>
                )}
              </div>

              <div className={styles.nav}>
                {step > 0 ? (
                  <Button variant="ghost" onClick={() => goTo(step - 1)} disabled={status === 'sending'}>
                    <ArrowLeft size={17} aria-hidden="true" /> {t('contact.back')}
                  </Button>
                ) : (
                  <span />
                )}
                <div className={styles.navEnd}>
                  {status === 'error' && (
                    <p className={styles.error} role="alert">
                      {t('contact.failed')}
                    </p>
                  )}
                  <Button type="submit" size="l" disabled={status === 'sending'}>
                    {step < LAST ? (
                      <>
                        {t('contact.continue')} <ArrowRight size={17} aria-hidden="true" />
                      </>
                    ) : status === 'sending' ? (
                      t('contact.sending')
                    ) : (
                      <>
                        {previewing ? t('contact.sendPreview') : t('contact.send')} <Send size={16} aria-hidden="true" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          )}
        </Card>
      </div>
    </SiteLayout>
  )
}
