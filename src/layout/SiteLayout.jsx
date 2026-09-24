import { useEffect, useState } from 'react'
import { Button } from '../components'
import styles from './SiteLayout.module.css'

/**
 * Header, main column and footer shared by every page. On the home page the
 * nav links are in-page anchors; elsewhere they point back to the home page's
 * sections.
 */
export default function SiteLayout({ home = false, children }) {
  const [scrolled, setScrolled] = useState(false)

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
          <Button variant="ghost" size="s" href={to('contact')}>Contact</Button>
        </nav>
      </header>

      <main className={styles.main}>{children}</main>

      <footer className={styles.footer}>
        © {new Date().getFullYear()} Aaron Anehasse
      </footer>
    </div>
  )
}
