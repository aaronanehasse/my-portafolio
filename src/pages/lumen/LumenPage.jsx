import { ArrowLeft } from 'lucide-react'
import LumenSite from './LumenSite.jsx'
import styles from './LumenPage.module.css'

/** /demo/lumen: the demo site on its own, as a normal page. */
export default function LumenPage() {
  return (
    <>
      <LumenSite />
      <a className={styles.back} href="/services/websites">
        <ArrowLeft size={15} aria-hidden="true" />
        Demo by Aaron Anehasse
      </a>
    </>
  )
}
