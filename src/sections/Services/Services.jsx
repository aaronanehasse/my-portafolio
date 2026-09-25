import { Check } from 'lucide-react'
import { Button, Card, Tag } from '../../components'
import { useT } from '../../i18n/index.jsx'
import { ComponentsArt, MobileArt, WebsiteArt } from './art.jsx'
import styles from './Services.module.css'

/*
 * Each service is getting its own page with packs and prices. Websites has
 * one (/services/websites); the others show `note` until theirs exists.
 */

// Where each card links and what it shows; the words are in the language files (services.items.<id>)
const services = [
  { id: 'websites', href: '/services/websites', Art: WebsiteArt },
  { id: 'components', href: '#philosophy', Art: ComponentsArt },
  { id: 'mobile', Art: MobileArt },
]

export default function Services() {
  const { t } = useT()
  return (
    <section className={styles.services} aria-labelledby="services-title">
      <div className={styles.head}>
        <h2 id="services-title" className={styles.title}>{t('services.title')}</h2>
        <p className={styles.intro}>{t('services.intro')}</p>
      </div>

      <ul className={styles.grid}>
        {services.map(({ id, href, Art }) => {
          const { audience, title, description, points, note, example } = t(`services.items.${id}`)
          return (
            <li key={id}>
              <Card as="article" className={styles.card}>
                <div className={styles.stage}>
                  <Art />
                </div>
                <Tag>{audience}</Tag>
                <h3 className={styles.cardTitle}>{title}</h3>
                <p className={styles.description}>{description}</p>
                <ul className={styles.points}>
                  {points.map((point) => (
                    <li key={point}>
                      <Check className={styles.check} size={16} strokeWidth={2.5} aria-hidden="true" />
                      {point}
                    </li>
                  ))}
                </ul>
                <div className={styles.footer}>
                  {href ? (
                    <a className={styles.link} href={href}>
                      {example}
                    </a>
                  ) : (
                    <span className={styles.note}>{note}</span>
                  )}
                </div>
              </Card>
            </li>
          )
        })}
      </ul>

      <div className={styles.cta}>
        <p className={styles.ctaText}>{t('services.ctaText')}</p>
        <Button size="l" href="/contact">
          {t('services.cta')}
        </Button>
      </div>
    </section>
  )
}
