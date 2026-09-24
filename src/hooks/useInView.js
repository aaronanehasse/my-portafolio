import { useEffect, useState } from 'react'

/**
 * True once `ref`'s element has entered the viewport, and it stays true.
 * `rootMargin` grows (or shrinks, if negative) the viewport it checks against.
 */
export default function useInView(ref, { rootMargin = '0px', threshold = 0 } = {}) {
  // No observer (old browsers, tests): treat everything as already seen
  const [inView, setInView] = useState(() => typeof IntersectionObserver === 'undefined')

  useEffect(() => {
    const el = ref.current
    if (inView || !el) return undefined
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setInView(true)
          observer.disconnect()
        }
      },
      { rootMargin, threshold },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [ref, inView, rootMargin, threshold])

  return inView
}
