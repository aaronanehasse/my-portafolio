import { useState } from 'react'
import { Button, ClothField, DeckEmbers, Tag } from '../../components'
import BuildShowcase from './BuildShowcase.jsx'
import styles from './Hero.module.css'

/**
 * Top-of-page hero: intro text on the left, a half-body cutout on the right.
 * Put your transparent PNG/WebP at public/hero.png (or pass `image`).
 */
export default function Hero({
  name = 'Aaron Anehasse',
  role = 'User interface designer & full-stack developer',
  intro = (
    <>
      In an era where everyone can use AI to build software, the human factor, the attention to
      detail and natural experience are a requirement for any enterprise-grade product.
      <br />
      <br />
      I help companies build software that is not only functional, but also delightful to use. The future of software is human-centered
    </>
  ),
  image = '/hero.png',
  status = 'Available for freelance work',
}) {
  const [imageMissing, setImageMissing] = useState(false)

  return (
    <section className={styles.hero} aria-labelledby="hero-title">
      <ClothField className={styles.field} every={5} reach={420} />
      <div className={styles.text}>
        {status && <Tag variant="accent">{status}</Tag>}
        <h1 id="hero-title" className={styles.title}>
          Hi, I&apos;m <span className={styles.name}>{name}</span>
        </h1>
        <p className={styles.role}>{role}</p>
        <p className={styles.intro}>{intro}</p>
        <div className={styles.actions}>
          <Button size="l" href="#projects">See my work</Button>
          <Button variant="secondary" size="l" href="/contact">Get in touch</Button>
        </div>
      </div>

      <div className={styles.visual}>
        {/* Sparks shed off the circle's rim; measures the circle, its next sibling */}
        <DeckEmbers color="--accent" shape="circle" pad={56} rate={3} speed={0.5} glow={0.45} />
        <div className={styles.glow} aria-hidden="true" />
        {imageMissing ? (
          <div className={styles.placeholder}>
            Add your photo at
            <code>public/hero.png</code>
          </div>
        ) : (
          <img
            className={styles.image}
            src={image}
            alt={`Portrait of ${name}`}
            onError={() => setImageMissing(true)}
          />
        )}
        <BuildShowcase />
      </div>
    </section>
  )
}
