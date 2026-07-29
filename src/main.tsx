import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n'
import App from './App.tsx'
import { applyTheme, cachedTheme } from './lib/settings'
import { registerSW } from 'virtual:pwa-register'

// Paint in the right theme on the very first frame, before React mounts.
applyTheme(cachedTheme())

// Installable + instant reloads. A new deploy is picked up on the next visit.
registerSW({ immediate: true })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
