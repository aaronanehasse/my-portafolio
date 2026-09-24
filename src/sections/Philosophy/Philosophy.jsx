import { useState } from 'react'
import { Card, Tag } from '../../components'
import { CloneArt, CraftArt } from './illustrations.jsx'
import styles from './Philosophy.module.css'

/**
 * The argument in two beats (the problem, the answer), then the proof: three
 * takes on the same brief — the Echo AI icon — to show what craft adds.
 * The first two takes are static SVGs (public/philosophy/*.svg); the third is
 * a live component, passed as `echo`.
 */

const defaultPoints = [
  {
    label: 'The problem',
    title: 'Software is easy to copy',
    body: 'Thanks to AI, the amount of software being built is growing exponentially. A competitor can copy your product, or even improve on it, in record time.',
    Art: CloneArt,
  },
  {
    label: 'The answer',
    title: 'Craft is what AI can’t copy',
    body: 'An experienced designer who builds gives you what AI can’t easily clone: the detail, the feel, a product that is unmistakably yours. That’s what lifts conversion and strengthens your position.',
    Art: CraftArt,
    accent: true,
  },
]

const defaultSteps = [
  {
    label: 'AI',
    title: 'AI generated',
    description: 'A decent concept on paper, but it looks like exactly that: a concept. Not something a business should ship.',
    svg: '/philosophy/ai.svg',
  },
  {
    label: 'Average developer',
    title: 'Developer made',
    description: 'It works, but it lacks soul. Perfectly fine for a basic product, not for a company that competes on quality.',
    svg: '/philosophy/developer.svg',
    float: true,
  },
  {
    label: 'Me',
    title: 'Alive',
    description:
      'Not just animated, but alive. Nothing is pre-made; every motion happens in real time. Try the states on it, or click it while it’s idle.',
    accent: true,
  },
]

export default function Philosophy({
  title = 'My philosophy',
  lead = 'Anyone can build software now. That’s exactly why yours needs to stand out.',
  points = defaultPoints,
  steps = defaultSteps,
  echo = null,
}) {
  return (
    <section id="philosophy" className={styles.philosophy} aria-labelledby="philosophy-title">
      <div className={styles.head}>
        <h2 id="philosophy-title" className={styles.title}>{title}</h2>
        <p className={styles.lead}>{lead}</p>
      </div>

      {/* The argument: two matching cards, problem then answer */}
      <div className={styles.points}>
        {points.map(({ label, title: pointTitle, body, Art, accent }) => (
          <article key={label} className={styles.point}>
            <div className={styles.pointArt}>
              <Art className={styles.art} />
            </div>
            <Tag variant={accent ? 'accent' : undefined}>{label}</Tag>
            <h3 className={styles.pointTitle}>{pointTitle}</h3>
            <p className={styles.pointBody}>{body}</p>
          </article>
        ))}
      </div>

      {/* The proof: one brief, three makers */}
      <div className={styles.compare}>
        <div className={styles.compareHead}>
          <h3 className={styles.subTitle}>Same brief, three results</h3>
          <p className={styles.muted}>
            The icon for Echo, an AI product of mine, as each kind of maker would deliver it.
          </p>
        </div>

        <ol className={styles.steps}>
          {steps.map((step, i) => (
            <li key={step.label}>
              <Card as="article" className={`${styles.step} ${step.accent ? styles.stepAccent : ''}`}>
                <div className={styles.stage}>
                  {step.svg ? (
                    <SvgSlot
                      src={step.svg}
                      alt={`Echo AI icon, ${step.title.toLowerCase()} version`}
                      float={step.float}
                    />
                  ) : (
                    echo ?? <div className={styles.placeholder}>Echo component coming soon</div>
                  )}
                </div>
                <div className={styles.body}>
                  <Tag variant={step.accent ? 'accent' : undefined}>
                    {String(i + 1).padStart(2, '0')} · {step.label}
                  </Tag>
                  <h4 className={styles.stepTitle}>{step.title}</h4>
                  <p className={styles.description}>{step.description}</p>
                </div>
              </Card>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

/** Shows the SVG, or an empty slot naming the file it's waiting for. */
function SvgSlot({ src, alt, float = false }) {
  const [missing, setMissing] = useState(false)

  if (missing) {
    return (
      <div className={styles.placeholder}>
        Add SVG at
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
