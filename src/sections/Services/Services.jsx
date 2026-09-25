import { Check } from 'lucide-react'
import { Button, Card, Tag } from '../../components'
import { ComponentsArt, MobileArt, WebsiteArt } from './art.jsx'
import styles from './Services.module.css'

/*
 * Each service is getting its own page with packs and prices. Websites has
 * one (/services/websites); the others show `note` until theirs exists.
 */

const services = [
  {
    id: 'websites',
    audience: 'For businesses',
    title: 'Full website creation',
    description:
      'Complete websites for businesses, designed and built with maximum attention to detail. Depending on complexity, delivered in as little as 48 hours.',
    points: ['Every page designed, nothing templated', 'Live in as little as 48 hours', 'Domain, hosting and maintenance available'],
    example: { label: 'See the full service →', href: '/services/websites' },
    Art: WebsiteArt,
  },
  {
    id: 'components',
    audience: 'For developers',
    title: 'Curated components',
    description:
      'Components, animations and interactive sets for developers who’d rather stay out of complex, detail-heavy work. Built to drop into your modular stack.',
    points: ['Made for React, Vue or whatever you use', 'Animation and interaction included', 'Crafted to your request'],
    example: { label: 'Example: the Echo icon', href: '#philosophy' },
    Art: ComponentsArt,
  },
  {
    id: 'mobile',
    audience: 'For businesses',
    title: 'Mobile apps',
    description:
      'Mobile apps built with React Native: one codebase for iOS and Android, with the same care as the web. From the first release to ongoing maintenance.',
    points: ['iOS and Android from one codebase', 'Designed and developed by one person', 'Maintenance plans available'],
    note: 'Packs and pricing coming soon',
    Art: MobileArt,
  },
]

export default function Services() {
  return (
    <section className={styles.services} aria-labelledby="services-title">
      <div className={styles.head}>
        <h2 id="services-title" className={styles.title}>Services</h2>
        <p className={styles.intro}>Three ways to work together, all with the same attention to detail.</p>
      </div>

      <ul className={styles.grid}>
        {services.map(({ id, audience, title, description, points, note, example, Art }) => (
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
                {example ? (
                  <a className={styles.link} href={example.href}>
                    {example.label}
                  </a>
                ) : (
                  <span className={styles.note}>{note}</span>
                )}
              </div>
            </Card>
          </li>
        ))}
      </ul>

      <div className={styles.cta}>
        <p className={styles.ctaText}>Not sure which fits? Tell me what you’re building.</p>
        <Button size="l" href="/contact">
          Start a project
        </Button>
      </div>
    </section>
  )
}
