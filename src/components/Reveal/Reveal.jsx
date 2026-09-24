import { useRef } from 'react'
import useInView from '../../hooks/useInView.js'
import styles from './Reveal.module.css'

/**
 * Mounts its section only once you scroll near it, then fades it in as it
 * comes on screen. Until then it holds `minHeight` so the page keeps its
 * length and anchors (`id`) still land.
 * `eager` mounts straight away — for what's above the fold.
 */
export default function Reveal({ id, eager = false, minHeight = 400, className, children }) {
  const ref = useRef(null)
  const near = useInView(ref, { rootMargin: '300px 0px' })
  const seen = useInView(ref, { rootMargin: '0px 0px -15% 0px' })
  const mounted = eager || near

  return (
    <div
      ref={ref}
      id={id}
      className={[styles.reveal, seen && styles.shown, className].filter(Boolean).join(' ')}
      style={mounted ? undefined : { minHeight }}
    >
      {mounted && children}
    </div>
  )
}
