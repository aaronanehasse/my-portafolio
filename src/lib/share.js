import en from '../i18n/locales/en.js'
import nl from '../i18n/locales/nl.js'

/*
 * What a shared link shows (Discord, WhatsApp, Slack…): title, description
 * and the card image, per page and language. Crawlers don't run the app, so
 * middleware.js writes these into the HTML and api/og.js draws the card.
 *
 * Both run on Vercel, outside Vite, so the languages are imported one by one
 * here instead of through import.meta.glob. A new language goes in `messages`.
 * The words all come from the language files; nothing here is new copy.
 */

export const SITE = 'https://www.aaronanehasse.space'
export const DEFAULT_LANG = 'en'

const messages = { en: en.messages, nl: nl.messages }
export const LANGS = Object.keys(messages)

// Each page and the keys its card is made of. `headline` may hold {accent}, filled from `accent`.
const pages = {
  home: { path: '/', label: 'hero.status', headline: 'hero.role', text: 'philosophy.lead' },
  websites: {
    path: '/services/websites',
    label: 'websites.tag',
    headline: 'websites.title',
    accent: 'websites.titleAccent',
    text: 'websites.facts.0',
  },
  contact: { path: '/contact', label: 'nav.contact', headline: 'contact.title', text: 'contact.intro' },
  privacy: { path: '/privacy', label: 'footer.privacy', headline: 'legal.privacy.title', text: 'legal.privacy.intro' },
  imprint: { path: '/imprint', label: 'footer.imprint', headline: 'legal.imprint.title', text: 'legal.imprint.intro' },
  lumen: { path: '/demo/lumen', label: 'lumen.back', headline: 'titles.lumen', text: 'websites.demoNote' },
}

/** '/contact/' → 'contact'; anything unknown is shared as the home page. */
export function pageFor(pathname) {
  const path = pathname.replace(/\/+$/, '') || '/'
  return Object.keys(pages).find((key) => pages[key].path === path) ?? 'home'
}

/** 'nl', 'NL', 'nl-BE' → 'nl'; anything we don't have → English. */
export const langFor = (code) => {
  const base = String(code ?? '').toLowerCase().split('-')[0]
  return messages[base] ? base : DEFAULT_LANG
}

const lookup = (m, key) => key.split('.').reduce((node, part) => node?.[part], m)

/**
 * { page, lang, path, title, description, label, headline } for a page key.
 * `headline` is [{ text, accent }] so the card can colour the accent words.
 */
export function share(page, lang) {
  if (!pages[page]) page = 'home'
  const p = pages[page]
  lang = langFor(lang)
  const t = (key) => lookup(messages[lang], key) ?? lookup(messages[DEFAULT_LANG], key) ?? ''

  const [before, after = ''] = t(p.headline).split('{accent}')
  const headline = p.accent
    ? [{ text: before }, { text: t(p.accent), accent: true }, { text: after }]
    : [{ text: before }]

  return {
    page,
    lang,
    path: p.path,
    title: t(`titles.${page}`),
    description: t(p.text),
    label: t(p.label),
    headline: headline.filter((part) => part.text),
  }
}
