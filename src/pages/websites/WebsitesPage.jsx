import { useState } from 'react'
import { ArrowRight, BadgeCheck, Clock, ExternalLink, Globe, Maximize2, PenTool } from 'lucide-react'
import { Button, Card, Reveal, Tag } from '../../components'
import SiteLayout from '../../layout/SiteLayout.jsx'
import LumenOverlay from './LumenOverlay.jsx'
import PreviewRequest from './PreviewRequest.jsx'
import { BuildArt, DecideArt, RequestArt } from './previewArt.jsx'
import SiteDemo from './SiteDemo.jsx'
import styles from './WebsitesPage.module.css'

const facts = [
  { Icon: BadgeCheck, text: 'Free preview first, pay only if you continue' },
  { Icon: Clock, text: 'Live in as little as 48 hours' },
  { Icon: PenTool, text: 'Every page designed, nothing templated' },
  { Icon: Globe, text: 'Domain, hosting and maintenance available' },
]

const steps = [
  {
    title: 'Request a preview',
    text: 'Tell me about your business and what the site should do. It takes a couple of minutes.',
    Art: RequestArt,
  },
  {
    title: 'I build it within hours',
    text: 'Once I accept your request, you get a real preview with 2–3 sections, usually within a few hours.',
    Art: BuildArt,
  },
  {
    title: 'You decide',
    text: 'Like it? We carry on and build the full site. Not for you? You walk away and pay nothing.',
    Art: DecideArt,
  },
]

/** /services/websites: the full website creation service. */
export default function WebsitesPage() {
  const [demoOpen, setDemoOpen] = useState(false)

  return (
    <SiteLayout>
      <Reveal eager>
        <section className={styles.hero} aria-labelledby="websites-title">
          <div className={styles.text}>
            <Tag variant="accent">Service · Website creation</Tag>
            <h1 id="websites-title" className={styles.title}>
              Your full website, <span className={styles.accent}>designed and built</span> in as little as 48 hours.
            </h1>
            <p className={styles.intro}>
              Every page designed with care, built to be fast, and handed over ready to go live. I can take care of
              the domain, hosting and maintenance too, so you never have to think about it.
            </p>
            <ul className={styles.facts}>
              {facts.map(({ Icon, text }) => (
                <li key={text}>
                  <Icon className={styles.factIcon} size={18} aria-hidden="true" />
                  {text}
                </li>
              ))}
            </ul>
            <div className={styles.actions}>
              <Button size="l" href="#request">
                Request a free preview <ArrowRight size={18} aria-hidden="true" />
              </Button>
              <Button variant="secondary" size="l" href="/#projects">
                See my work
              </Button>
            </div>
          </div>

          <div className={styles.demo}>
            <SiteDemo onMaximize={() => setDemoOpen(true)} />
            <div className={styles.demoBar}>
              <span className={styles.demoNote}>Lumen is a demo site, built as a real, working page.</span>
              <div className={styles.demoActions}>
                <Button variant="secondary" size="s" onClick={() => setDemoOpen(true)}>
                  <Maximize2 size={15} aria-hidden="true" /> Explore it
                </Button>
                <Button variant="ghost" size="s" href="/demo/lumen" target="_blank" rel="noreferrer">
                  <ExternalLink size={15} aria-hidden="true" /> New tab
                </Button>
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      <Reveal id="free-preview" minHeight={560}>
        <section className={styles.preview} aria-labelledby="preview-title">
          <div className={styles.previewHead}>
            <Tag variant="accent">Free preview · No commitment</Tag>
            <h2 id="preview-title" className={styles.sectionTitle}>
              See your website before you spend a thing.
            </h2>
            <p className={styles.intro}>
              I’ll build a preview of your site for free. If it’s not what you want, there’s nothing to pay and
              nothing to cancel.
            </p>
          </div>
          <ol className={styles.steps}>
            {steps.map(({ title, text, Art }, i) => (
              <li key={title}>
                <Card as="article" className={styles.step}>
                  <div className={styles.stepArt}>
                    <Art />
                  </div>
                  <Tag>{String(i + 1).padStart(2, '0')}</Tag>
                  <h3 className={styles.stepTitle}>{title}</h3>
                  <p className={styles.stepText}>{text}</p>
                </Card>
              </li>
            ))}
          </ol>
        </section>
      </Reveal>

      <Reveal id="request" minHeight={640}>
        <PreviewRequest />
      </Reveal>

      <LumenOverlay open={demoOpen} onClose={() => setDemoOpen(false)} />
    </SiteLayout>
  )
}
