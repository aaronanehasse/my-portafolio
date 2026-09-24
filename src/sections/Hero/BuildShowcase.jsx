import { useCallback, useEffect, useState } from 'react'
import { BUILDS } from './builds.jsx'
import styles from './BuildShowcase.module.css'

// One loop per build: type the code (and build the UI in step with it), let it live, then leave.
const TYPE_MS = 5600
const HOLD_MS = 2400
const EXIT_MS = 700
const TOTAL_MS = TYPE_MS + HOLD_MS + EXIT_MS
const TICK_MS = 40

const cx = (...c) => c.filter(Boolean).join(' ')

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setReduced(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return reduced
}

/**
 * Decorative "motion graphics" behind and beside the hero photo:
 * blurred JSX typing itself out top-left, and the matching UI component
 * assembling itself bottom-right, then swapping for the next one.
 */
export default function BuildShowcase() {
  const reduced = usePrefersReducedMotion()
  const [index, setIndex] = useState(0)
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (reduced) return
    const start = performance.now()
    const id = setInterval(() => {
      const e = performance.now() - start
      if (e >= TOTAL_MS) {
        setElapsed(0)
        setIndex((i) => (i + 1) % BUILDS.length)
      } else {
        setElapsed(e)
      }
    }, TICK_MS)
    return () => clearInterval(id)
  }, [index, reduced])

  // Live width × height for the selection badge, like a design tool shows
  const [size, setSize] = useState(null)
  const measureRef = useCallback((node) => {
    if (!node) return
    const ro = new ResizeObserver(([entry]) => {
      const box = entry.borderBoxSize?.[0]
      if (box) setSize(`${Math.round(box.inlineSize)} × ${Math.round(box.blockSize)}`)
    })
    ro.observe(node)
    return () => ro.disconnect()
  }, [])

  const build = BUILDS[index]
  const time = reduced ? TYPE_MS + 1 : elapsed
  const progress = Math.min(1, time / TYPE_MS)
  const holding = time >= TYPE_MS && time < TYPE_MS + HOLD_MS
  const exiting = time >= TYPE_MS + HOLD_MS
  const holdT = holding ? time - TYPE_MS : exiting ? HOLD_MS : 0

  const n = build.stages.length - 1
  const stage = Math.min(n, Math.floor(progress * (n + 1)))
  const typed = build.code.slice(0, Math.floor(progress * build.code.length))
  const { Component } = build

  return (
    <>
      <pre className={cx(styles.code, exiting && styles.codeOut)} aria-hidden="true">
        {highlight(typed)}
        {!exiting && <span className={styles.caret} />}
      </pre>

      <div className={styles.builder} aria-hidden="true">
        <div className={cx(styles.chipSlot, progress >= 1 && styles.chipHidden)}>
          <span key={`${index}-${stage}`} className={styles.chip}>
            <ChipText text={build.stages[stage]} />
          </span>
        </div>

        <div key={index} className={cx(styles.stage, exiting && styles.exit)}>
          <div ref={measureRef}>
            <Component s={stage} p={progress} t={holdT} live={holding || exiting} />
          </div>
          <span className={cx(styles.selection, progress >= 1 && styles.selectionDone)}>
            <i /><i /><i /><i />
            {size && <span className={styles.size}>{size}</span>}
          </span>
        </div>
      </div>
    </>
  )
}

// `prop: value` gets the property in the accent; markup stays muted.
function ChipText({ text }) {
  const i = text.indexOf(': ')
  if (i < 0) return <span className={styles.chipMarkup}>{text}</span>
  return (
    <>
      <span className={styles.chipProp}>{text.slice(0, i)}</span>: {text.slice(i + 2)}
    </>
  )
}

// Tiny JSX highlighter — it only has to look right through a blur.
const TOKEN =
  /(\/\/.*)|('[^'\n]*'?)|(<\/?[A-Za-z][\w.]*|\/?>)|\b(export|function|return|const|import|from|default)\b|([A-Za-z]+)(?==)|(\d+)/g
const TOKEN_CLASS = [null, styles.com, styles.str, styles.tag, styles.kw, styles.attr, styles.num]

function highlight(src) {
  const out = []
  let last = 0
  for (const m of src.matchAll(TOKEN)) {
    if (m.index > last) out.push(src.slice(last, m.index))
    const group = m.findIndex((g, i) => i > 0 && g !== undefined)
    out.push(
      <span key={m.index} className={TOKEN_CLASS[group]}>
        {m[0]}
      </span>,
    )
    last = m.index + m[0].length
  }
  if (last < src.length) out.push(src.slice(last))
  return out
}
