import { lazy, Suspense, useEffect } from 'react'
import HomePage from './pages/HomePage.jsx'

// Each page beyond the home page is its own chunk
const WebsitesPage = lazy(() => import('./pages/websites/WebsitesPage.jsx'))
const LumenPage = lazy(() => import('./pages/lumen/LumenPage.jsx'))

/*
 * Pages are picked from the path. Links between pages are ordinary <a>s (a
 * full page load), which keeps things simple for a site this size.
 * Hosting needs a fallback that serves index.html for every path.
 */
const routes = {
  '/services/websites': { Page: WebsitesPage, title: 'Website creation · Aaron Anehasse' },
  '/demo/lumen': { Page: LumenPage, title: 'Lumen — bookkeeping that runs itself (demo)' },
}

export default function App() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/'
  const route = routes[path]

  useEffect(() => {
    document.title = route?.title ?? 'Aaron Anehasse'
  }, [route])

  if (!route) return <HomePage />
  const { Page } = route
  return (
    <Suspense fallback={null}>
      <Page />
    </Suspense>
  )
}
