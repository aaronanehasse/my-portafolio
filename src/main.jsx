import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Always open at the top. The browser would otherwise restore the old scroll
// position on reload (or jump to a leftover #hash from a nav click), and with
// sections mounting lazily that restored spot lands somewhere arbitrary.
// A fresh visit to a deep link (someone opening /#contact) still goes there.
history.scrollRestoration = 'manual'
const isReload = performance.getEntriesByType('navigation')[0]?.type === 'reload'
if (isReload || !location.hash) {
  if (location.hash) history.replaceState(null, '', location.pathname + location.search)
  window.scrollTo(0, 0)
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
