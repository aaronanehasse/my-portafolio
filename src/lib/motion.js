import { useEffect, useRef, useState } from 'react'

/* Easing toolkit for hand-choreographed timelines. All take x in 0–1. */

export const clamp01 = (x) => Math.min(1, Math.max(0, x))
/** Progress of t through the window [a, b], clamped to 0–1. */
export const seg = (t, a, b) => clamp01((t - a) / (b - a))
export const lerp = (a, b, k) => a + (b - a) * k
export const easeOutCubic = (x) => 1 - (1 - x) ** 3
export const easeInCubic = (x) => x ** 3
export const easeInOutCubic = (x) => (x < 0.5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2)
/** Overshoots past 1 and settles back: things land instead of stopping. */
export const easeOutBack = (x, s = 1.7) => 1 + (s + 1) * (x - 1) ** 3 + s * (x - 1) ** 2
/** Pulls back first, then goes: anticipation. */
export const easeInBack = (x, s = 1.7) => (s + 1) * x ** 3 - s * x ** 2
/** Damped oscillation around 0, for wobble after a release. τ in seconds. */
export const wobble = (tau, damping = 4.5, freq = 16) => (tau < 0 ? 1 : Math.exp(-damping * tau) * Math.cos(freq * tau))
/** A smooth 0→1→0 bump centred on c, of half-width w. */
export const bell = (t, c, w) => {
  const x = (t - c) / w
  return Math.abs(x) >= 1 ? 0 : 0.5 + 0.5 * Math.cos(Math.PI * x)
}

/** Interpolates [time, x, y] keyframes with ease-in-out between each pair. */
export function track(t, keys) {
  if (t <= keys[0][0]) return [keys[0][1], keys[0][2]]
  for (let i = 1; i < keys.length; i++) {
    const [t1, x1, y1] = keys[i]
    if (t <= t1) {
      const [t0, x0, y0] = keys[i - 1]
      const k = easeInOutCubic(seg(t, t0, t1))
      return [lerp(x0, x1, k), lerp(y0, y1, k)]
    }
  }
  const last = keys[keys.length - 1]
  return [last[1], last[2]]
}

/**
 * Which action of a repeating set is playing at time u, and how far into it.
 * @param {{ name: string, dur: number }[]} actions
 * @returns {[string, number, number]} [name, seconds into it, index]
 */
export function actionAt(u, actions) {
  for (let i = 0; i < actions.length; i++) {
    if (u < actions[i].dur) return [actions[i].name, u, i]
    u -= actions[i].dur
  }
  const last = actions.length - 1
  return [actions[last].name, actions[last].dur, last]
}

export const loopLength = (actions) => actions.reduce((sum, a) => sum + a.dur, 0)

/**
 * A clock in seconds for "play the intro once, then loop the actions": it runs
 * 0 → intro, then cycles intro → intro + loop forever, never back to 0. It only
 * ticks while the element is on screen, and starts the first time it's seen so
 * the intro isn't missed. With reduced motion it returns `still` and never ticks.
 * Returns [ref, t, elapsed]: `t` is the looping clock, `elapsed` never wraps.
 */
export function useTimeline({ intro, loop, still }) {
  const ref = useRef(null)
  const [reduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  // Raw seconds on screen; the looping clock is derived from it on render
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el || reduced) return
    let raf = 0
    let last = 0
    let total = 0

    const frame = (now) => {
      total += Math.min(0.05, (now - last) / 1000)
      last = now
      setElapsed(total)
      raf = requestAnimationFrame(frame)
    }
    const play = () => {
      if (raf) return
      last = performance.now()
      raf = requestAnimationFrame(frame)
    }
    const pause = () => {
      cancelAnimationFrame(raf)
      raf = 0
    }

    const io = new IntersectionObserver(([entry]) => (entry.isIntersecting ? play() : pause()), {
      threshold: 0.2,
    })
    io.observe(el)
    return () => {
      io.disconnect()
      pause()
    }
  }, [intro, loop, reduced])

  const t = elapsed < intro ? elapsed : intro + ((elapsed - intro) % loop)
  // Third value: raw seconds, for things that keep moving forward rather
  // than loop (a chart that keeps scrolling day after day)
  return [ref, reduced ? still : t, reduced ? still : elapsed]
}
