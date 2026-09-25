/*
 * The link-preview card, 1200×630, as plain Satori nodes ({ type, props })
 * so it needs no JSX step. Same palette as the site: near-black page, white
 * text at the site's opacities, the green accent. Flat, no glow.
 * Satori lays out with flexbox only, so every box is display:flex unless it
 * says otherwise.
 */

export const WIDTH = 1200
export const HEIGHT = 630

const PAGE = '#0b0b0b'
const TEXT = 'rgba(255, 255, 255, 0.92)'
const MUTED = 'rgba(255, 255, 255, 0.72)'
const FAINT = 'rgba(255, 255, 255, 0.6)'
const ACCENT = '#2fe57a'

// public/favicon.svg, inlined so drawing the card needs no second request
const LOGO =
  'data:image/svg+xml;base64,' +
  btoa(
    '<svg width="800" height="800" viewBox="0 0 800 800" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M603 592V210.58C603 144.765 533.831 101.284 474.025 128.757C397.941 163.708 318.608 199.249 246.071 233.556C215.338 248.091 196 279.164 196 313.161V510.149C196 527.994 214.784 539.598 230.742 531.611L468.5 412.606M196 654.5V700.313C196 714.891 211.095 724.571 224.343 718.49L287.5 689.5" stroke="url(#g)" stroke-width="101" stroke-linecap="round"/><defs><linearGradient id="g" x1="518.5" y1="100.5" x2="518.5" y2="798.5" gradientUnits="userSpaceOnUse"><stop stop-color="#30FFA5"/><stop offset="1" stop-color="#2FE57A"/></linearGradient></defs></svg>',
  )

const h = (type, style, children) => ({ type, props: { style: { display: 'flex', ...style }, children } })

/** `info` is what src/lib/share.js returns. */
export function card({ label, headline, description }) {
  // Long headlines step down so they stay within three lines
  const length = headline.reduce((n, part) => n + part.text.length, 0)
  const size = length > 60 ? 60 : length > 36 ? 68 : 80

  return h(
    'div',
    {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      width: '100%',
      height: '100%',
      padding: '64px 72px',
      background: PAGE,
      fontFamily: 'Inter',
      color: TEXT,
    },
    [
      h('div', { display: 'flex', alignItems: 'center', gap: 18 }, [
        { type: 'img', props: { src: LOGO, width: 52, height: 52 } },
        h('div', { fontSize: 28, fontWeight: 700, letterSpacing: '-0.01em' }, 'Aaron Anehasse'),
      ]),

      h('div', { display: 'flex', flexDirection: 'column', gap: 22 }, [
        h('div', { fontSize: 26, fontWeight: 700, color: ACCENT }, label),
        h(
          'div',
          {
            display: 'flex',
            flexWrap: 'wrap',
            maxWidth: 1056,
            fontSize: size,
            fontWeight: 700,
            lineHeight: 1.06,
            letterSpacing: '-0.035em',
          },
          // Each word its own box, so the accent run can wrap mid-phrase like normal text
          headline.flatMap((part) =>
            part.text
              .split(/(?<= )/)
              .filter(Boolean)
              .map((word) => h('span', { color: part.accent ? ACCENT : TEXT, whiteSpace: 'pre' }, word)),
          ),
        ),
        h('div', { maxWidth: 940, fontSize: 30, lineHeight: 1.4, color: MUTED }, description),
      ]),

      h('div', { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 24, color: FAINT }, [
        h('div', {}, 'aaronanehasse.space'),
        h('div', { width: 96, height: 6, borderRadius: 3, background: ACCENT }, []),
      ]),
    ],
  )
}
