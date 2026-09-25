import { ArrowLeft } from 'lucide-react'
import { useT } from '../../i18n/index.jsx'
import LumenSite from './LumenSite.jsx'
import styles from './LumenPage.module.css'

/** /demo/lumen: the demo site on its own, as a normal page. */
export default function LumenPage() {
  const { t } = useT()
  return (
    <>
      <LumenSite />
      <a className={styles.back} href="/services/websites">
        <ArrowLeft size={15} aria-hidden="true" />
        {t('lumen.back')}
      </a>
    </>
  )
}
