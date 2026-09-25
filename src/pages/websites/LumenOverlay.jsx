import { lazy, Suspense, useEffect, useRef } from 'react'
import { ExternalLink, Lock, X } from 'lucide-react'
import styles from './LumenOverlay.module.css'
import { useT } from '../../i18n/index.jsx'

// Only fetched the first time someone opens it
const LumenSite = lazy(() => import('../lumen/LumenSite.jsx'))

/**
 * The demo site, maximized: a full-screen browser window over the page.
 * It scrolls on its own; the page underneath is locked until it closes.
 * A native <dialog> gives focus trapping, Esc to close and an inert page
 * behind it for free. Clicking the backdrop closes it too.
 */
export default function LumenOverlay({ open, onClose }) {
  const { t } = useT()
  const dialogRef = useRef(null)
  const closeRef = useRef(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return undefined
    if (!open) {
      if (dialog.open) dialog.close()
      return undefined
    }

    dialog.showModal()
    // Start on the close button, so Esc / Enter is one step from leaving
    closeRef.current?.focus()
    // Lock the page behind; keep its width steady when the scrollbar goes
    const root = document.documentElement
    const gutter = window.innerWidth - root.clientWidth
    const prev = { overflow: root.style.overflow, paddingRight: root.style.paddingRight }
    root.style.overflow = 'hidden'
    root.style.paddingRight = `${gutter}px`

    return () => {
      root.style.overflow = prev.overflow
      root.style.paddingRight = prev.paddingRight
    }
  }, [open])

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-label={t('lumen.window')}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      {open && (
        <div className={styles.window}>
          <div className={styles.chrome}>
            <span className={styles.dots} aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <span className={styles.address}>
              <Lock size={12} aria-hidden="true" />
              lumenbooks.com
            </span>
            <a className={styles.tool} href="/demo/lumen" target="_blank" rel="noreferrer">
              <ExternalLink size={15} aria-hidden="true" />
              <span className={styles.toolLabel}>{t('lumen.newTab')}</span>
            </a>
            <button ref={closeRef} type="button" className={styles.close} onClick={onClose} aria-label={t('lumen.close')}>
              <X size={18} />
            </button>
          </div>
          <div className={styles.scroller} data-scroll-root>
            <Suspense fallback={<div className={styles.loading}>{t('lumen.loading')}</div>}>
              <LumenSite />
            </Suspense>
          </div>
        </div>
      )}
    </dialog>
  )
}
