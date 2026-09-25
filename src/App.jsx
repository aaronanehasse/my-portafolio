import { lazy, Suspense, useEffect } from 'react'
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
 */
const routes = {
  '/services/websites': {
    page: chunk(() => import('./pages/websites/WebsitesPage.jsx')),
    title: 'Website creation · Aaron Anehasse',
  },
  '/contact': { page: chunk(() => import('./pages/contact/ContactPage.jsx')), title: 'Start a project · Aaron Anehasse' },
  '/demo/lumen': {
    page: chunk(() => import('./pages/lumen/LumenPage.jsx')),
    title: 'Lumen — bookkeeping that runs itself (demo)',
    bare: true,
  },
}

export default function App() {
  return (
    <RouterProvider preload={(path) => routes[path]?.page.load()}>
      <Routes />
    </RouterProvider>
  )
}

function Routes() {
  const { path } = useRoute()
  const fade = usePageFade()
  const route = routes[path]

  useEffect(() => {
    document.title = route?.title ?? 'Aaron Anehasse'
  }, [route])

  if (!route) return <HomePage />
  const { page, bare } = route
  const Page = page.Component ?? page.Lazy
  return (
    <Suspense fallback={null}>
      {bare ? (
        <div className={fade}>
          <Page />
        </div>
      ) : (
        <Page />
      )}
    </Suspense>
  )
}
