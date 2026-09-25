import { lazy, Suspense, useEffect } from 'react'
import { I18nProvider, useT } from './i18n/index.jsx'
import { RouterProvider, usePageFade, useRoute } from './lib/router.jsx'
import HomePage from './pages/HomePage.jsx'

/**
 * A page in its own chunk. The router calls `load` as a visit starts; once the
 * code is in, `Component` is set and the page renders straight away. (Going
 * through React.lazy would still hold it back ~300 ms after the code arrived.)
 * `Lazy` covers opening the page directly.
 */
function chunk(importer) {
  const page = { Component: null }
  page.load = () =>
    importer().then((module) => {
      page.Component = module.default
      return module
    })
  page.Lazy = lazy(page.load)
  return page
}

/*
 * Pages are picked from the path. Links between pages are ordinary <a>s; the
 * router (lib/router.jsx) takes them over to fade between pages instead of
 * reloading. Hosting needs a fallback that serves index.html for every path.
 * `bare` pages don't use the shared layout, so they get the fade here.
 * `title` is a key in the language files (titles.*); `props` go to the page.
 */
const legal = chunk(() => import('./pages/legal/LegalPage.jsx'))

const routes = {
  '/services/websites': {
    page: chunk(() => import('./pages/websites/WebsitesPage.jsx')),
    title: 'websites',
  },
  '/contact': { page: chunk(() => import('./pages/contact/ContactPage.jsx')), title: 'contact' },
  '/demo/lumen': {
    page: chunk(() => import('./pages/lumen/LumenPage.jsx')),
    title: 'lumen',
    bare: true,
  },
  '/privacy': { page: legal, title: 'privacy', props: { doc: 'privacy' } },
  '/imprint': { page: legal, title: 'imprint', props: { doc: 'imprint' } },
}

export default function App() {
  return (
    <I18nProvider>
      <RouterProvider preload={(path) => routes[path]?.page.load()}>
        <Routes />
      </RouterProvider>
    </I18nProvider>
  )
}

function Routes() {
  const { path } = useRoute()
  const fade = usePageFade()
  const route = routes[path]
  const { t } = useT()
  const title = t(`titles.${route?.title ?? 'home'}`)

  useEffect(() => {
    document.title = title
  }, [title])

  if (!route) return <HomePage />
  const { page, bare, props } = route
  const Page = page.Component ?? page.Lazy
  return (
    <Suspense fallback={null}>
      {bare ? (
        <div className={fade}>
          <Page {...props} />
        </div>
      ) : (
        <Page {...props} />
      )}
    </Suspense>
  )
}
