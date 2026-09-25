import { ArrowRight, Check } from 'lucide-react'
import { Button, Card } from '../../components'
import styles from './PreviewRequest.module.css'

/*
 * The free-preview call to action. The request itself happens on /contact,
 * opened with the website type and the free preview already chosen.
 */

const REQUEST_URL = '/contact?type=website&preview=1'

const promises = [
  'A real preview with 2–3 sections, made within a few hours of accepting',
  'No commitment: if it’s not for you, you don’t pay anything',
  'If you like it, we carry on and build the full site',
]

const asks = ['Your business and what the site should do', 'Colours, pages or sites you like, if you have them', 'Where to send the preview']

export default function PreviewRequest() {
  return (
    <section className={styles.request} aria-labelledby="request-title">
      <div className={styles.side}>
        <h2 id="request-title" className={styles.title}>
          Request your free preview
        </h2>
        <p className={styles.intro}>
          Tell me a little about your business. Once I accept the request, I’ll make you a preview within a few
          hours.
        </p>
        <ul className={styles.promises}>
          {promises.map((p) => (
            <li key={p}>
              <Check className={styles.check} size={18} strokeWidth={2.5} aria-hidden="true" />
              {p}
            </li>
          ))}
        </ul>
      </div>

      <Card className={styles.card}>
        <p className={styles.cardLabel}>Takes about three minutes</p>
        <ol className={styles.asks}>
          {asks.map((a, i) => (
            <li key={a}>
              <span className={styles.num}>{i + 1}</span>
              {a}
            </li>
          ))}
        </ol>
        <div className={styles.actions}>
          <Button size="l" href={REQUEST_URL}>
            Request free preview <ArrowRight size={18} aria-hidden="true" />
          </Button>
          <span className={styles.fine}>Free. No card, no commitment.</span>
        </div>
      </Card>
    </section>
  )
}
