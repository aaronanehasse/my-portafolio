import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react'
import styles from './router.module.css'

/*
 * Moving between pages without a reload, so the change can be animated:
 * the page fades out while the window scrolls smoothly to the top, the next
 * page swaps in and fades up.
 *
 * Every same-site <a> click is taken over here, so links stay plain <a href>s
 * (middle-click, new tab and copy link all still work). Left alone: other
 * sites, target="_blank", downloads, modifier-clicks and /api. A link to the
 * page you're on scrolls smoothly to its #hash, or to the top.
 *
 * Back and forward get the same fade and land where you were: each history
 * entry remembers its scroll position.
 *
 * `preload(path)` (optional) starts fetching the next page's code as the fade
 * begins, so it's usually ready by the time the old page is gone.
 */

const FADE_MS = 240
const SCROLL_MAX_MS = 700 // a same-page scroll to the top gets this long at most, then finishes instantly
const PRELOAD_MAX_MS = 1500 // past this, swap anyway and let the page's own loading show
const SETTLE_FRAMES = 45 // ~¾ s of keeping the landing spot while lazy sections above it fill in

const RouteContext = createContext({ path: '/', leaving: false, arrived: false })

/** { path, leaving, arrived } — `arrived` turns true after the first in-app navigation. */
export const useRoute = () => useContext(RouteContext)

/**
 * The class that fades a page's content: in when it mounts after a navigation,
 * out while leaving. The shared layout puts it on main and footer (the header
 * stays put); a page without the layout gets it from App.
 */
export function usePageFade() {
  const { leaving, arrived } = useRoute()
  return [arrived && styles.enter, leaving && styles.leave].filter(Boolean).join(' ')
}

const normalise = (pathname) => pathname.replace(/\/+$/, '') || '/'
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const jump = (top) => window.scrollTo({ top, behavior: 'instant' })

/** Smoothly to the top, resolving when there (or after SCROLL_MAX_MS, finishing instantly). */
function scrollToTop() {
  if (window.scrollY <= 0) return Promise.resolve()
  if (reducedMotion()) {
    jump(0)
    return Promise.resolve()
  }
  window.scrollTo({ top: 0, behavior: 'smooth' })
  const start = performance.now()
  return new Promise((resolve) => {
    const check = () => {
      if (window.scrollY <= 1 || performance.now() - start > SCROLL_MAX_MS) {
        jump(0)
        resolve()
      } else requestAnimationFrame(check)
    }
    requestAnimationFrame(check)
  })
}

function scrollToHash(hash, behavior) {
  const el = hash && document.getElementById(decodeURIComponent(hash.slice(1)))
  if (!el) return false
  el.scrollIntoView({ behavior: reducedMotion() ? 'instant' : behavior, block: 'start' })
  return true
}

/**
 * Where the new page lands: its #hash, or the saved position (back/forward),
 * else the top. Lazy pages and sections above the spot fill in over the next
 * few frames and push it around, so it's held there briefly, until the
 * visitor scrolls themselves.
 */
function land({ hash, y }) {
  const inputs = ['wheel', 'touchstart', 'keydown', 'pointerdown']
  let frames = 0
  let stopped = false
  const stop = () => {
    stopped = true
    inputs.forEach((type) => window.removeEventListener(type, stop))
  }
  inputs.forEach((type) => window.addEventListener(type, stop, { passive: true }))

  const hold = () => {
    if (stopped) return
    if (!hash || !scrollToHash(hash, 'instant')) jump(y)
    if (++frames < SETTLE_FRAMES) requestAnimationFrame(hold)
    else stop()
  }
  hold()
}

export function RouterProvider({ preload, children }) {
  const [path, setPath] = useState(() => normalise(window.location.pathname))
  const [leaving, setLeaving] = useState(false)
  const [arrived, setArrived] = useState(false)
  const latest = useRef(0) // the newest navigation; an older one that's still fading gives way
  const pendingLanding = useRef(null)
  const preloadRef = useRef(preload)
  useEffect(() => {
    preloadRef.current = preload
  }, [preload])
  // popstate needs the page on screen now, not the one when the listener was made
  const pathRef = useRef(path)
  useEffect(() => {
    pathRef.current = path
  }, [path])

  useEffect(() => {
    const go = async (url, { push, y = 0 }) => {
      const id = ++latest.current
      if (push) {
        // Remember where we were, for coming back
        history.replaceState({ ...history.state, y: window.scrollY }, '')
      }
      const ready = Promise.race([preloadRef.current?.(normalise(url.pathname)), wait(PRELOAD_MAX_MS)]).catch(() => {})
      if (!reducedMotion()) {
        setLeaving(true)
        // Glide up while fading; a new visit starts at the top (back/forward restores its own spot).
        // No waiting for it: once the page has faded, the rest of the way happens unseen.
        if (push && window.scrollY > 0) window.scrollTo({ top: 0, behavior: 'smooth' })
        await Promise.all([wait(FADE_MS), ready])
      } else {
        await ready
      }
      if (id !== latest.current) return
      if (push) history.pushState({ y: 0 }, '', url.pathname + url.search + url.hash)
      pendingLanding.current = { hash: url.hash, y }
      setPath(normalise(url.pathname))
      setArrived(true)
      setLeaving(false)
    }

    const onClick = (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const a = e.target.closest?.('a[href]')
      if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return
      const url = new URL(a.href, window.location.href)
      if (url.origin !== window.location.origin || url.pathname.startsWith('/api/')) return

      e.preventDefault()
      const samePage = normalise(url.pathname) === normalise(window.location.pathname) && url.search === window.location.search
      if (!samePage) return go(url, { push: true })

      // Same page: glide to the section or the top, and keep the address bar in step
      if (url.hash) {
        if (scrollToHash(url.hash, 'smooth') && url.hash !== window.location.hash) history.pushState({ y: 0 }, '', url.hash)
      } else {
        scrollToTop()
      }
    }

    const onPop = (e) => {
      const url = new URL(window.location.href)
      // A #hash step within the same page: just scroll there
      if (normalise(url.pathname) === pathRef.current) {
        if (!scrollToHash(url.hash, 'smooth')) window.scrollTo({ top: e.state?.y ?? 0, behavior: 'smooth' })
        return
      }
      go(url, { push: false, y: e.state?.y ?? 0 })
    }

    document.addEventListener('click', onClick)
    window.addEventListener('popstate', onPop)
    return () => {
      document.removeEventListener('click', onClick)
      window.removeEventListener('popstate', onPop)
    }
  }, [])

  // The new page is in: put the scroll where it belongs before it's painted
  useLayoutEffect(() => {
    if (!pendingLanding.current) return
    land(pendingLanding.current)
    pendingLanding.current = null
  }, [path])

  return <RouteContext.Provider value={{ path, leaving, arrived }}>{children}</RouteContext.Provider>
}
