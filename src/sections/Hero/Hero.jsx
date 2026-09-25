import { Fragment, useState } from 'react'
import { Button, ClothField, DeckEmbers, Tag } from '../../components'
import { useT } from '../../i18n/index.jsx'
import BuildShowcase from './BuildShowcase.jsx'
import styles from './Hero.module.css'

/**
 * Top-of-page hero: intro text on the left, a half-body cutout on the right.
 * Put your transparent PNG/WebP at public/hero.png (or pass `image`).
 * The words are in the language files (hero.*).
 */
export default function Hero({ name = 'Aaron Anehasse', image = '/hero.png' }) {
  const { t } = useT()
  const [imageMissing, setImageMissing] = useState(false)
  const status = t('hero.status')

  return (
    <section className={styles.hero} aria-labelledby="hero-title">
      <ClothField className={styles.field} every={5} reach={420} />
      <div className={styles.text}>
        {status && <Tag variant="accent">{status}</Tag>}
        <h1 id="hero-title" className={styles.title}>
          {t('hero.title', { name: <span className={styles.name}>{name}</span> })}
        </h1>
        <p className={styles.role}>{t('hero.role')}</p>
        <p className={styles.intro}>
          {t('hero.intro').map((paragraph, i) => (
            <Fragment key={i}>
              {i > 0 && (
                <>
                  <br />
                  <br />
                </>
              )}
              {paragraph}
            </Fragment>
          ))}
        </p>
        <div className={styles.actions}>
          <Button size="l" href="#projects">
            {t('hero.seeWork')}
          </Button>
          <Button variant="secondary" size="l" href="/contact">
            {t('hero.contact')}
          </Button>
        </div>
      </div>

      <div className={styles.visual}>
        {/* Sparks shed off the circle's rim; measures the circle, its next sibling */}
        <DeckEmbers color="--accent" shape="circle" pad={56} rate={3} speed={0.5} glow={0.45} />
        <div className={styles.glow} aria-hidden="true" />
        {imageMissing ? (
          <div className={styles.placeholder}>
            {t('hero.photoMissing')}
            <code>public/hero.png</code>
          </div>
        ) : (
          <img
            className={styles.image}
            src={image}
            alt={t('hero.portrait', { name })}
            onError={() => setImageMissing(true)}
          />
        )}
        <BuildShowcase />
      </div>
    </section>
  )
}
