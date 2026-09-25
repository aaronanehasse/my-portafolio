import { ArrowRight, Check } from 'lucide-react'
import { Button, Card } from '../../components'
import { useT } from '../../i18n/index.jsx'
import styles from './PreviewRequest.module.css'

/*
 * The free-preview call to action. The request itself happens on /contact,
 * opened with the website type and the free preview already chosen.
 */

const REQUEST_URL = '/contact?type=website&preview=1'

export default function PreviewRequest() {
  const { t } = useT()
  return (
    <section className={styles.request} aria-labelledby="request-title">
      <div className={styles.side}>
        <h2 id="request-title" className={styles.title}>
          {t('request.title')}
        </h2>
        <p className={styles.intro}>{t('request.intro')}</p>
        <ul className={styles.promises}>
          {t('request.promises').map((p) => (
            <li key={p}>
              <Check className={styles.check} size={18} strokeWidth={2.5} aria-hidden="true" />
              {p}
            </li>
          ))}
        </ul>
      </div>

      <Card className={styles.card}>
        <p className={styles.cardLabel}>{t('request.duration')}</p>
        <ol className={styles.asks}>
          {t('request.asks').map((a, i) => (
            <li key={a}>
              <span className={styles.num}>{i + 1}</span>
              {a}
            </li>
          ))}
        </ol>
        <div className={styles.actions}>
          <Button size="l" href={REQUEST_URL}>
            {t('request.button')} <ArrowRight size={18} aria-hidden="true" />
          </Button>
          <span className={styles.fine}>{t('request.fine')}</span>
        </div>
      </Card>
    </section>
  )
}
