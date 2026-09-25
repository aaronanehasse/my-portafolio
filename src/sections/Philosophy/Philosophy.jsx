import { useState } from 'react'
import { Card, Tag } from '../../components'
import { useT } from '../../i18n/index.jsx'
import { CloneArt, CraftArt } from './illustrations.jsx'
import styles from './Philosophy.module.css'

/**
 * The argument in two beats (the problem, the answer), then the proof: three
 * takes on the same brief — the Echo AI icon — to show what craft adds.
 * The first two takes are static SVGs (public/philosophy/*.svg); the third is
 * a live component, passed as `echo`.
 */

// What each part shows; the words are in the language files (philosophy.points / .steps), in the same order
const points = [{ Art: CloneArt }, { Art: CraftArt, accent: true }]
const steps = [{ svg: '/philosophy/ai.svg' }, { svg: '/philosophy/developer.svg', float: true }, { accent: true }]

export default function Philosophy({ echo = null }) {
  const { t } = useT()
  const pointWords = t('philosophy.points')
  const stepWords = t('philosophy.steps')

  return (
    <section id="philosophy" className={styles.philosophy} aria-labelledby="philosophy-title">
      <div className={styles.head}>
        <h2 id="philosophy-title" className={styles.title}>{t('philosophy.title')}</h2>
        <p className={styles.lead}>{t('philosophy.lead')}</p>
      </div>

      {/* The argument: two matching cards, problem then answer */}
      <div className={styles.points}>
        {points.map(({ Art, accent }, i) => (
          <article key={i} className={styles.point}>
            <div className={styles.pointArt}>
              <Art className={styles.art} />
            </div>
            <Tag variant={accent ? 'accent' : undefined}>{pointWords[i].label}</Tag>
            <h3 className={styles.pointTitle}>{pointWords[i].title}</h3>
            <p className={styles.pointBody}>{pointWords[i].body}</p>
          </article>
        ))}
      </div>

      {/* The proof: one brief, three makers */}
      <div className={styles.compare}>
        <div className={styles.compareHead}>
          <h3 className={styles.subTitle}>{t('philosophy.compareTitle')}</h3>
          <p className={styles.muted}>{t('philosophy.compareText')}</p>
        </div>

        <ol className={styles.steps}>
          {steps.map((step, i) => {
            const words = stepWords[i]
            return (
              <li key={i}>
                <Card as="article" className={`${styles.step} ${step.accent ? styles.stepAccent : ''}`}>
                  <div className={styles.stage}>
                    {step.svg ? (
                      <SvgSlot
                        src={step.svg}
                        alt={t('philosophy.iconAlt', { version: words.title.toLowerCase() })}
                        float={step.float}
                      />
                    ) : (
                      echo ?? <div className={styles.placeholder}>{t('philosophy.comingSoon')}</div>
                    )}
                  </div>
                  <div className={styles.body}>
                    <Tag variant={step.accent ? 'accent' : undefined}>
                      {String(i + 1).padStart(2, '0')} · {words.label}
                    </Tag>
                    <h4 className={styles.stepTitle}>{words.title}</h4>
                    <p className={styles.description}>{words.description}</p>
                  </div>
                </Card>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}

/** Shows the SVG, or an empty slot naming the file it's waiting for. */
function SvgSlot({ src, alt, float = false }) {
  const { t } = useT()
  const [missing, setMissing] = useState(false)

  if (missing) {
    return (
      <div className={styles.placeholder}>
        {t('philosophy.svgMissing')}
        <code>public{src}</code>
      </div>
    )
  }

  return (
    <img
      className={`${styles.svg} ${float ? styles.float : ''}`}
      src={src}
      alt={alt}
      onError={() => setMissing(true)}
    />
  )
}
