import { ImageResponse } from '@vercel/og'
import { share } from '../src/lib/share.js'
import { card, HEIGHT, WIDTH } from './_og/card.js'

/**
 * GET /api/og?page=contact&lang=nl — the link-preview image for a page, in a
 * language. middleware.js points og:image here. `page` is a key from
 * src/lib/share.js; unknown pages and languages fall back to home / English.
 *
 * Works on Vercel's Node and edge runtimes alike: the fonts are fetched from
 * the site itself (public/og) rather than read from disk.
 *
 * The output only changes when the words or the card do, so it's cached hard;
 * middleware.js adds a version (?v=) to bump when the card changes.
 */

let fonts // loaded once per instance

const load = (origin) =>
  Promise.all(
    ['400', '700'].map(async (weight) => {
      const res = await fetch(`${origin}/og/inter-${weight}.woff`)
      if (!res.ok) throw new Error(`Font ${weight}: ${res.status}`)
      return { name: 'Inter', data: await res.arrayBuffer(), weight: Number(weight), style: 'normal' }
    }),
  )

export async function GET(request) {
  const url = new URL(request.url)
  fonts ??= load(url.origin).catch((error) => {
    fonts = undefined // try again next time
    throw error
  })

  return new ImageResponse(card(share(url.searchParams.get('page'), url.searchParams.get('lang'))), {
    width: WIDTH,
    height: HEIGHT,
    fonts: await fonts,
    headers: { 'Cache-Control': 'public, max-age=86400, s-maxage=31536000, immutable' },
  })
}
