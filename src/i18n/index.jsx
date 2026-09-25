import { createContext, Fragment, useCallback, useContext, useEffect, useMemo, useState } from 'react'

/*
 * Translations.
 *
 * Every file in ./locales is a language: `en.jsx` is English, `nl.jsx` Dutch.
 * They're found automatically, so adding a language is adding one file:
 *
 *   export default {
 *     name: 'Français',   // shown in the language switcher
 *     short: 'FR',
 *     messages: { ... },  // same keys as en.jsx; anything missing falls back to English
 *   }
 *
 * Which language shows, in order: ?lang=xx in the URL (e.g. ?lang=nl, which
 * is also how to send someone a link in that language), then the visitor's
 * saved choice, then their browser's language, then English. A ?lang= link is
 * saved as their choice, and switching language keeps the URL in step, so
 * the address bar is always a link to what's on screen.
 *
 * In a component: const { t, lang, setLang } = useT()
 *   t('hero.role')                        a string
 *   t('work.intro', { count: 2 })         "{count}" filled in
 *   t('hero.title', { name: <b>…</b> })   React nodes can fill a placeholder too
 *   t('services.items')                   arrays and objects come back whole
 */

const files = import.meta.glob('./locales/*.jsx', { eager: true })

/** { en: { name, short, messages }, nl: {…}, … } */
export const languages = Object.fromEntries(
  Object.entries(files).map(([path, module]) => [path.match(/([\w-]+)\.jsx$/)[1], module.default]),
)

export const DEFAULT_LANG = 'en'
const STORAGE_KEY = 'lang'
const PARAM = 'lang'

/** 'NL', 'nl-BE' → 'nl', if that's a language we have. */
function match(code) {
  if (!code) return null
  const base = String(code).toLowerCase().split('-')[0]
  return languages[base] ? base : null
}

function detect() {
  const fromUrl = match(new URLSearchParams(window.location.search).get(PARAM))
  if (fromUrl) {
    try {
      localStorage.setItem(STORAGE_KEY, fromUrl)
    } catch {
      // Storage blocked: the URL still sets it for this visit
    }
    return fromUrl
  }
  try {
    const saved = match(localStorage.getItem(STORAGE_KEY))
    if (saved) return saved
  } catch {
    // Storage blocked: fall through to the browser's language
  }
  for (const code of navigator.languages ?? [navigator.language]) {
    const found = match(code)
    if (found) return found
  }
  return DEFAULT_LANG
}

/** The current URL with ?lang= set to `lang`. */
export function urlWithLang(lang) {
  const url = new URL(window.location.href)
  url.searchParams.set(PARAM, lang)
  return url.pathname + url.search + url.hash
}

const lookup = (messages, key) => key.split('.').reduce((node, part) => node?.[part], messages)

/** "Hi {name}" with { name } filled in. Strings stay strings; React nodes make it an array. */
function fill(text, vars) {
  if (!vars || typeof text !== 'string') return text
  const parts = text.split(/\{(\w+)\}/)
  if (parts.length === 1) return text
  const onlyText = Object.values(vars).every((v) => typeof v === 'string' || typeof v === 'number')
  if (onlyText) return parts.map((part, i) => (i % 2 ? (vars[part] ?? `{${part}}`) : part)).join('')
  return parts.map((part, i) => (i % 2 ? <Fragment key={i}>{vars[part]}</Fragment> : part))
}

const I18nContext = createContext(null)

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(detect)

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const setLang = useCallback((next) => {
    if (!languages[next]) return
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Storage blocked: it still switches for this visit
    }
    history.replaceState(history.state, '', urlWithLang(next))
    // A short dip through transparent, so the whole page doesn't snap to new words
    const content = document.querySelectorAll('main, footer')
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce || !content.length || !content[0].animate) return setLangState(next)
    const out = [...content].map((el) => el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 140, easing: 'ease-in', fill: 'forwards' }))
    Promise.all(out.map((a) => a.finished)).then(() => {
      setLangState(next)
      requestAnimationFrame(() => {
        out.forEach((a) => a.cancel())
        content.forEach((el) => el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 260, easing: 'ease-out' }))
      })
    })
  }, [])

  const value = useMemo(() => {
    const messages = languages[lang].messages
    const fallback = languages[DEFAULT_LANG].messages
    const t = (key, vars) => {
      let text = lookup(messages, key)
      if (text === undefined) text = lookup(fallback, key)
      if (text === undefined) {
        if (import.meta.env.DEV) console.warn(`[i18n] missing "${key}"`)
        return key
      }
      return fill(text, vars)
    }
    return { lang, setLang, t }
  }, [lang, setLang])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

/** { t, lang, setLang }. See the top of this file. */
export function useT() {
  return useContext(I18nContext)
}
