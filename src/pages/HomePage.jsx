import { lazy, Suspense } from 'react'
import { Reveal } from '../components'
import SiteLayout from '../layout/SiteLayout.jsx'
import Hero from '../sections/Hero/Hero.jsx'

// Below the fold: their code is only fetched once you scroll near them
const Philosophy = lazy(() => import('../sections/Philosophy/Philosophy.jsx'))
const EchoPlayground = lazy(() => import('../sections/Philosophy/EchoPlayground.jsx'))
const Work = lazy(() => import('../sections/Work/Work.jsx'))
const Services = lazy(() => import('../sections/Services/Services.jsx'))

export default function HomePage() {
  return (
    <SiteLayout home>
      <Reveal eager>
        <Hero />
      </Reveal>

      <Reveal minHeight={640}>
        <Suspense fallback={<div style={{ minHeight: 640 }} />}>
          <Philosophy echo={<EchoPlayground />} />
        </Suspense>
      </Reveal>

      <Reveal id="projects" minHeight={900}>
        <Suspense fallback={<div style={{ minHeight: 900 }} />}>
          <Work />
        </Suspense>
      </Reveal>

      <Reveal id="services" minHeight={820}>
        <Suspense fallback={<div style={{ minHeight: 820 }} />}>
          <Services />
        </Suspense>
      </Reveal>
    </SiteLayout>
  )
}
