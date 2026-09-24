import { ArrowUpRight } from 'lucide-react'
import { Button, Tag } from '../../components'
import { CrateScene, LodeScene } from './scenes.jsx'
import styles from './Work.module.css'

/*
 * PLACEHOLDERS — replace before launch:
 *   - Lode Studio description: only the tagline is confirmed
 */

const products = [
  {
    id: 'lode-studio',
    name: 'Lode Studio',
    kind: 'Desktop app',
    color: '#cc5be0',
    logo: '/work/lodemc.png',
    tagline: 'Create custom Minecraft content.',
    description:
      'A desktop app for building custom Minecraft content. Designed, engineered and shipped end to end under my own company.',
    stats: [
      { value: '20k', label: 'Downloads' },
      { value: '3k', label: 'Active creators' },
      { value: '3', label: 'Win · Mac · Linux' },
    ],
    href: 'https://lodemc.net',
    Scene: LodeScene,
  },
  {
    id: 'nmcrate',
    name: 'NMCrate',
    kind: 'Marketplace',
    color: '#ff86fd',
    logo: '/work/nmcrate.png',
    tagline: 'The Minecraft marketplace.',
    description:
      'A community-driven marketplace where server owners and builders buy and sell plugins, models, datapacks and tools, with creator studios, a server directory and forums.',
    stats: [
      { value: '100+', label: 'Listings' },
      { value: '80+', label: 'Creators' },
      { value: '80+', label: 'Sales' },
    ],
    href: 'https://nmcrate.net',
    Scene: CrateScene,
  },
]

function Logo({ src, name }) {
  if (src) return <img className={styles.logo} src={src} alt={`${name} logo`} />
  return (
    <span className={`${styles.logo} ${styles.logoSlot}`} aria-hidden="true">
      {(name.match(/[A-Z]/g) || [name[0]]).slice(0, 2).join('')}
    </span>
  )
}

export default function Work() {
  return (
    <section className={styles.work} aria-labelledby="work-title">
      <div className={styles.head}>
        <h2 id="work-title" className={styles.title}>Selected work</h2>
        <p className={styles.intro}>
          Most of my work is private and protected, but here&apos;s what I can share: two products I
          designed and built from the ground up.
        </p>
      </div>

      {products.map(({ id, name, kind, color, logo, tagline, description, stats, href, Scene }, i) => (
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
              <Tag variant="accent" className={styles.role}>Founder</Tag>
            </div>
            <p className={styles.tagline}>{tagline}</p>
            <p className={styles.description}>{description}</p>
            <dl className={styles.stats}>
              {stats.map((stat) => (
                <div key={stat.label} className={styles.stat}>
                  <dt className={styles.statLabel}>{stat.label}</dt>
                  <dd className={styles.statValue}>{stat.value}</dd>
                </div>
              ))}
            </dl>
            <div>
              <Button variant="secondary" href={href} target="_blank" rel="noreferrer">
                Visit {href.replace('https://', '')}
                <ArrowUpRight size={16} aria-hidden="true" />
              </Button>
            </div>
          </div>

          <div className={styles.stage}>
            <Scene />
          </div>
        </article>
      ))}
    </section>
  )
}
