import { DEFAULT_LANG, LANGS, langFor, pageFor, share, SITE } from './src/lib/share.js'

/*
 * Link previews per page and language. Discord, WhatsApp and the like read
 * the raw HTML without running the app, so every page would otherwise share
 * index.html's tags. This serves index.html with the <!-- share --> block
 * rewritten for the path and ?lang= (English without it), and html lang set.
 * The image is drawn by api/og.js.
 *
 * Vercel runs this before its rewrites; files (anything with a dot) and /api
 * skip it. If index.html can't be fetched (a protected preview, say), the
 * request carries on untouched.
 */

export const config = { matcher: ['/((?!api/|.*\\.).*)'] }

// Bump when the card's look changes, so Discord and co. fetch it again
const CARD_VERSION = 1

const escape = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

const withLang = (path, lang) => (lang === DEFAULT_LANG ? path : `${path}?lang=${lang}`)

function tags(info, origin) {
  const url = SITE + withLang(info.path, info.lang)
  const image = `${origin}/api/og?page=${info.page}&lang=${info.lang}&v=${CARD_VERSION}`
  const meta = (attr, key, value) => `<meta ${attr}="${key}" content="${escape(value)}" />`
  return [
    `<title>${escape(info.title)}</title>`,
    meta('name', 'description', info.description),
    `<link rel="canonical" href="${escape(url)}" />`,
    ...LANGS.map((l) => `<link rel="alternate" hreflang="${l}" href="${escape(SITE + withLang(info.path, l))}" />`),
    `<link rel="alternate" hreflang="x-default" href="${escape(SITE + info.path)}" />`,
    meta('property', 'og:type', 'website'),
    meta('property', 'og:site_name', 'Aaron Anehasse'),
    meta('property', 'og:title', info.title),
    meta('property', 'og:description', info.description),
    meta('property', 'og:url', url),
    meta('property', 'og:image', image),
    meta('property', 'og:image:width', '1200'),
    meta('property', 'og:image:height', '630'),
    meta('property', 'og:image:alt', info.title),
    meta('name', 'twitter:card', 'summary_large_image'),
    meta('name', 'twitter:title', info.title),
    meta('name', 'twitter:description', info.description),
    meta('name', 'twitter:image', image),
  ].join('\n    ')
}

export default async function middleware(request) {
  const url = new URL(request.url)
  const page = await fetch(new URL('/index.html', url))
  if (!page.ok) return

  const info = share(pageFor(url.pathname), langFor(url.searchParams.get('lang')))
  const html = (await page.text())
    .replace(/<!-- share[\s\S]*?<!-- \/share -->/, tags(info, url.origin))
    .replace(/<html lang="[^"]*"/, `<html lang="${info.lang}"`)

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=0, must-revalidate' },
  })
}
