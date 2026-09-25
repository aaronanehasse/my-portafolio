import { useEffect, useState } from 'react'
import { Button } from '../components'
import { usePageFade } from '../lib/router.jsx'
import styles from './SiteLayout.module.css'

/**
 * Header, main column and footer shared by every page. On the home page the
 * nav links are in-page anchors; elsewhere they point back to the home page's
 * sections. Contact is its own page (/contact); `current` marks the page you're on.
 */
export default function SiteLayout({ home = false, current, children }) {
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
        <a className={styles.logoLink} href="/" aria-label="Aaron Anehasse, home">
          <img className={styles.logo} src="/logo.png" alt="" />
        </a>
        <nav className={styles.nav}>
          <Button variant="ghost" size="s" href={to('projects')}>Projects</Button>
          <Button variant="ghost" size="s" href={to('services')}>Services</Button>
          <Button variant="ghost" size="s" href="/contact" aria-current={current === 'contact' ? 'page' : undefined}>
            Contact
          </Button>
        </nav>
      </header>

      <main className={`${styles.main} ${fade}`}>{children}</main>

      <footer className={`${styles.footer} ${fade}`}>
        © {new Date().getFullYear()} Aaron Anehasse
      </footer>
    </div>
  )
}
