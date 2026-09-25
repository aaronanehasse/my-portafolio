import { useId } from 'react'
import { Moon, Sun } from 'lucide-react'
import { useT } from '../../i18n/index.jsx'
import { styleById } from './options.js'
import css from './SitePreview.module.css'

/*
 * A small sketch of the visitor's site that redraws as they answer: their
 * business name, their pages in the nav, their colours on the buttons, their
 * chosen style's typeface, in dark or light. Not a design, just enough for
 * the answers to feel like a site taking shape. Decorative: every answer is
 * also in the form. Pass `onTheme` to show the dark/light switch.
 */

const THEMES = [
  { id: 'dark', Icon: Moon },
  { id: 'light', Icon: Sun },
]

// Before brand colours are chosen: greys that read on each theme
const NEUTRAL = {
  dark: { primary: '#e9e9e6', secondary: '#55585e', accent: '' },
  light: { primary: '#2b2d31', secondary: '#9aa0a6', accent: '' },
}

/** Dark or light text, whichever reads on this colour. */
function inkOn(hex) {
  const n = parseInt(hex.slice(1), 16)
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.4 ? '#141414' : '#ffffff'
}

export default function SitePreview({ business, pages, colors, style, features, theme = 'dark', onTheme }) {
  const { t } = useT()
  const ts = (key) => t(`contact.sketch.${key}`)
  const radioName = useId()
  const name = business.trim() || ts('yourBusiness')
  // Each colour falls back on its own, so choosing just a primary already shows
  const base = NEUTRAL[theme] ?? NEUTRAL.dark
  const c = {
    primary: colors?.primary || base.primary,
    secondary: colors?.secondary || base.secondary,
    accent: colors?.accent || '',
  }
  const face = styleById[style]
  const type = face
    ? { fontFamily: face.font, fontWeight: face.weight, fontStyle: face.italic ? 'italic' : undefined }
    : { fontWeight: 700 }
  const domain = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '') || 'yourbusiness'}.com`
  const shop = features.includes('store')
  const cta = features.includes('booking') ? ts('bookNow') : shop ? ts('shop') : ts('contact')

  return (
    <figure className={css.preview}>
      <div
        className={css.window}
        data-theme={theme}
        aria-hidden="true"
        style={{
          '--p': c.primary,
          '--p-ink': inkOn(c.primary),
          '--s': c.secondary,
          '--a': c.accent || c.secondary,
        }}
      >
        <div className={css.chrome}>
          <span className={css.dots}>
            <i />
            <i />
            <i />
          </span>
          <span className={css.url}>{domain}</span>
        </div>

        <div className={css.site}>
          <nav className={css.nav}>
            <span className={css.brand}>
              <span className={css.mark}>{name[0].toUpperCase()}</span>
              <span className={css.brandName} style={type}>
                {name}
              </span>
            </span>
            <span className={css.links}>
              {pages.slice(0, 4).map((p) => (
                <span key={p}>{p}</span>
              ))}
              {pages.length > 4 && <span>+{pages.length - 4}</span>}
            </span>
            <span className={css.navCta}>{cta}</span>
          </nav>

          <div className={css.hero}>
            <div className={css.heroText}>
              <span className={css.eyebrow} />
              <span className={css.headline} style={type}>
                {name}
              </span>
              <span className={css.line} />
              <span className={css.line} style={{ width: '62%' }} />
              <span className={css.buttons}>
                <span className={css.primary}>{cta}</span>
                <span className={css.secondary}>{ts('learnMore')}</span>
              </span>
            </div>
            <div className={css.art}>
              <span className={css.blobA} />
              <span className={css.blobB} />
            </div>
          </div>

          <div className={css.cards}>
            {[0, 1, 2].map((i) => (
              <span key={i} className={css.card}>
                <span className={shop ? css.product : css.cardIcon} />
                <span className={css.cardLine} />
                {shop ? <span className={css.price} /> : <span className={css.cardLine} style={{ width: '70%' }} />}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className={css.bar}>
        <figcaption className={css.caption}>{ts('caption')}</figcaption>
        {onTheme && (
          <div className={css.themes} role="radiogroup" aria-label={ts('themeLabel')}>
            {THEMES.map(({ id, Icon }) => (
              <label key={id} className={`${css.theme} ${theme === id ? css.themeOn : ''}`}>
                <input
                  className={css.hiddenInput}
                  type="radio"
                  name={radioName}
                  checked={theme === id}
                  onChange={() => onTheme(id)}
                />
                <Icon size={13} aria-hidden="true" />
                {t(`contact.o.theme.${id}`)}
              </label>
            ))}
          </div>
        )}
      </div>
    </figure>
  )
}
