import { useEffect, useState } from 'react'
import { Button } from '../components'
import { languages, urlWithLang, useT } from '../i18n/index.jsx'
import { usePageFade } from '../lib/router.jsx'
import styles from './SiteLayout.module.css'

/**
 * Header, main column and footer shared by every page. On the home page the
 * nav links are in-page anchors; elsewhere they point back to the home page's
 * sections. Contact is its own page (/contact); `current` marks the page you're on.
 * The footer has the legal pages and the language switch, one entry per file
 * in src/i18n/locales.
 */
export default function SiteLayout({ home = false, current, children }) {
  const { t, lang, setLang } = useT()
  const [scrolled, setScrolled] = useState(false)
  // The header stays put between pages; everything under it fades
  const fade = usePageFade()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 0)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const to = (id) => (home ? `#${id}` : `/#${id}`)

  return (
    <div className={styles.page}>
      <header className={`${styles.header} ${scrolled ? styles.headerScrolled : ''}`}>
        <a className={styles.logoLink} href="/" aria-label={t('nav.home')}>
          <img className={styles.logo} src="/logo.png" alt="" />
        </a>
        <nav className={styles.nav}>
          <Button variant="ghost" size="s" href={to('projects')}>
            {t('nav.projects')}
          </Button>
          <Button variant="ghost" size="s" href={to('services')}>
            {t('nav.services')}
          </Button>
          <Button variant="ghost" size="s" href="/contact" aria-current={current === 'contact' ? 'page' : undefined}>
            {t('nav.contact')}
          </Button>
        </nav>
      </header>

      <main className={`${styles.main} ${fade}`}>{children}</main>

      <footer className={`${styles.footer} ${fade}`}>
        <div className={styles.footerStart}>
          <span>{t('footer.copyright', { year: new Date().getFullYear() })}</span>
          <a className={styles.footerLink} href="/privacy">
            {t('footer.privacy')}
          </a>
          <a className={styles.footerLink} href="/imprint">
            {t('footer.imprint')}
          </a>
        </div>
        <nav className={styles.languages} aria-label={t('footer.language')}>
          {Object.entries(languages).map(([code, { name, short }]) => (
            // Real links (?lang=xx), so they can be opened or copied; a plain click switches in place
            <a
              key={code}
              href={urlWithLang(code)}
              hrefLang={code}
              lang={code}
              title={name}
              aria-label={name}
              aria-current={code === lang ? 'true' : undefined}
              className={`${styles.language} ${code === lang ? styles.languageOn : ''}`}
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
                e.preventDefault()
                setLang(code)
              }}
            >
              {short}
            </a>
          ))}
        </nav>
      </footer>
    </div>
  )
}
