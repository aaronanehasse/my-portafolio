import { useState } from 'react'
import { ArrowRight, Clock, ExternalLink, Globe, Maximize2, PenTool } from 'lucide-react'
import { Button, Reveal, Tag } from '../../components'
import SiteLayout from '../../layout/SiteLayout.jsx'
import LumenOverlay from './LumenOverlay.jsx'
import SiteDemo from './SiteDemo.jsx'
import styles from './WebsitesPage.module.css'

const facts = [
  { Icon: Clock, text: 'Live in as little as 48 hours' },
  { Icon: PenTool, text: 'Every page designed, nothing templated' },
  { Icon: Globe, text: 'Domain, hosting and maintenance available' },
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
              <Button size="l" href="/#contact">
                Get a quote <ArrowRight size={18} aria-hidden="true" />
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
      <LumenOverlay open={demoOpen} onClose={() => setDemoOpen(false)} />
    </SiteLayout>
  )
}
