import { ArrowUpRight } from 'lucide-react'
import { Button, Tag } from '../../components'
import { useT } from '../../i18n/index.jsx'
import { CrateScene, LodeScene } from './scenes.jsx'
import styles from './Work.module.css'

/*
 * PLACEHOLDERS — replace before launch:
 *   - Lode Studio description: only the tagline is confirmed
 *
 * The words (kind, tagline, description, stat labels) are in the language
 * files under work.products.<id>; stat values here line up with their labels.
 */

const products = [
  {
    id: 'lode-studio',
    name: 'Lode Studio',
    color: '#cc5be0',
    logo: '/work/lodemc.png',
    stats: ['20k', '3k', '3'],
    href: 'https://lodemc.net',
    Scene: LodeScene,
  },
  {
    id: 'nmcrate',
    name: 'NMCrate',
    color: '#ff86fd',
    logo: '/work/nmcrate.png',
    stats: ['100+', '80+', '80+'],
    href: 'https://nmcrate.net',
    Scene: CrateScene,
  },
]

function Logo({ src, name }) {
  const { t } = useT()
  if (src) return <img className={styles.logo} src={src} alt={t('work.logo', { name })} />
  return (
    <span className={`${styles.logo} ${styles.logoSlot}`} aria-hidden="true">
      {(name.match(/[A-Z]/g) || [name[0]]).slice(0, 2).join('')}
    </span>
  )
}

export default function Work() {
  const { t } = useT()
  return (
    <section className={styles.work} aria-labelledby="work-title">
      <div className={styles.head}>
        <h2 id="work-title" className={styles.title}>{t('work.title')}</h2>
        <p className={styles.intro}>{t('work.intro')}</p>
      </div>

      {products.map(({ id, name, color, logo, stats, href, Scene }, i) => {
        const { kind, tagline, description, stats: statLabels } = t(`work.products.${id}`)
        return (
          <article
            key={id}
            className={`${styles.product} ${i % 2 ? styles.productFlip : ''}`}
            // Each product wears its own brand colour in place of the site accent
            style={{ '--accent': color }}
          >
            <div className={styles.info}>
              <div className={styles.brand}>
                <Logo src={logo} name={name} />
                <div className={styles.brandText}>
                  <h3 className={styles.name}>{name}</h3>
                  <span className={styles.kind}>{kind}</span>
                </div>
                <Tag variant="accent" className={styles.role}>{t('work.founder')}</Tag>
              </div>
              <p className={styles.tagline}>{tagline}</p>
              <p className={styles.description}>{description}</p>
              <dl className={styles.stats}>
                {stats.map((value, j) => (
                  <div key={j} className={styles.stat}>
                    <dt className={styles.statLabel}>{statLabels[j]}</dt>
                    <dd className={styles.statValue}>{value}</dd>
                  </div>
                ))}
              </dl>
              <div>
                <Button variant="secondary" href={href} target="_blank" rel="noreferrer">
                  {t('work.visit', { site: href.replace('https://', '') })}
                  <ArrowUpRight size={16} aria-hidden="true" />
                </Button>
              </div>
            </div>

            <div className={styles.stage}>
              <Scene />
            </div>
          </article>
        )
      })}
    </section>
  )
}
