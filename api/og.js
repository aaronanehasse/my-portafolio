import { ImageResponse } from '@vercel/og'
import { share } from '../src/lib/share.js'
import { card, HEIGHT, WIDTH } from './_og/card.js'

/**
 * GET /api/og?page=contact&lang=nl — the link-preview image for a page, in a
 * language. middleware.js points og:image here. `page` is a key from
 * src/lib/share.js; unknown pages and languages fall back to home / English.
 *
 * The output only changes when the words or the card do, so it's cached hard;
 * middleware.js adds a version (?v=) to bump when the card changes.
 */

export const config = { runtime: 'edge' }

const font = (file) => fetch(new URL(file, import.meta.url)).then((r) => r.arrayBuffer())
const fonts = Promise.all([font('./_og/inter-latin-400-normal.woff'), font('./_og/inter-latin-700-normal.woff')])

export default async function handler(request) {
  const params = new URL(request.url).searchParams
  const [regular, bold] = await fonts

  return new ImageResponse(card(share(params.get('page'), params.get('lang'))), {
    width: WIDTH,
    height: HEIGHT,
    fonts: [
      { name: 'Inter', data: regular, weight: 400, style: 'normal' },
      { name: 'Inter', data: bold, weight: 700, style: 'normal' },
    ],
    headers: { 'Cache-Control': 'public, max-age=86400, s-maxage=31536000, immutable' },
  })
}
