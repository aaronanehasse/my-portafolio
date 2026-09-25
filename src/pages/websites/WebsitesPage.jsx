import { useState } from 'react'
import { ArrowRight, BadgeCheck, Clock, ExternalLink, Globe, Maximize2, PenTool } from 'lucide-react'
import { Button, Card, Reveal, Tag } from '../../components'
import { useT } from '../../i18n/index.jsx'
import SiteLayout from '../../layout/SiteLayout.jsx'
import LumenOverlay from './LumenOverlay.jsx'
import PreviewRequest from './PreviewRequest.jsx'
import { BuildArt, DecideArt, RequestArt } from './previewArt.jsx'
import SiteDemo from './SiteDemo.jsx'
import styles from './WebsitesPage.module.css'

// Icons and art, in the same order as their words in the language files (websites.facts / .steps)
const factIcons = [BadgeCheck, Clock, PenTool, Globe]
const stepArt = [RequestArt, BuildArt, DecideArt]

/** /services/websites: the full website creation service. */
export default function WebsitesPage() {
  const { t } = useT()
  const [demoOpen, setDemoOpen] = useState(false)

  return (
    <SiteLayout>
      <Reveal eager>
        <section className={styles.hero} aria-labelledby="websites-title">
          <div className={styles.text}>
            <Tag variant="accent">{t('websites.tag')}</Tag>
            <h1 id="websites-title" className={styles.title}>
              {t('websites.title', { accent: <span className={styles.accent}>{t('websites.titleAccent')}</span> })}
            </h1>
            <p className={styles.intro}>{t('websites.intro')}</p>
            <ul className={styles.facts}>
              {t('websites.facts').map((text, i) => {
                const Icon = factIcons[i]
                return (
                  <li key={i}>
                    <Icon className={styles.factIcon} size={18} aria-hidden="true" />
                    {text}
                  </li>
                )
              })}
            </ul>
            <div className={styles.actions}>
              <Button size="l" href="/contact?type=website&preview=1">
                {t('websites.requestPreview')} <ArrowRight size={18} aria-hidden="true" />
              </Button>
              <Button variant="secondary" size="l" href="/#projects">
                {t('websites.seeWork')}
              </Button>
            </div>
          </div>

          <div className={styles.demo}>
            <SiteDemo onMaximize={() => setDemoOpen(true)} />
            <div className={styles.demoBar}>
              <span className={styles.demoNote}>{t('websites.demoNote')}</span>
              <div className={styles.demoActions}>
                <Button variant="secondary" size="s" onClick={() => setDemoOpen(true)}>
                  <Maximize2 size={15} aria-hidden="true" /> {t('websites.explore')}
                </Button>
                <Button variant="ghost" size="s" href="/demo/lumen" target="_blank" rel="noreferrer">
                  <ExternalLink size={15} aria-hidden="true" /> {t('websites.newTab')}
                </Button>
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      <Reveal id="free-preview" minHeight={560}>
        <section className={styles.preview} aria-labelledby="preview-title">
          <div className={styles.previewHead}>
            <Tag variant="accent">{t('websites.previewTag')}</Tag>
            <h2 id="preview-title" className={styles.sectionTitle}>
              {t('websites.previewTitle')}
            </h2>
            <p className={styles.intro}>{t('websites.previewIntro')}</p>
          </div>
          <ol className={styles.steps}>
            {t('websites.steps').map(({ title, text }, i) => {
              const Art = stepArt[i]
              return (
                <li key={i}>
                  <Card as="article" className={styles.step}>
                    <div className={styles.stepArt}>
                      <Art />
                    </div>
                    <Tag>{String(i + 1).padStart(2, '0')}</Tag>
                    <h3 className={styles.stepTitle}>{title}</h3>
                    <p className={styles.stepText}>{text}</p>
                  </Card>
                </li>
              )
            })}
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
