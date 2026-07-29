import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// Served from https://<user>.github.io/moneytracker/ — the base path has to match
// the repo name, and the router basename below is derived from it.
const BASE = '/moneytracker/'

export default defineConfig({
  base: BASE,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Money Tracker',
        short_name: 'Money',
        description: 'Bullet-journal income and expense tracker',
        lang: 'en-GB',
        start_url: BASE,
        scope: BASE,
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#faf7f0',
        theme_color: '#faf7f0',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Phase 1: precache the app shell only. Data still requires the network.
        // Phase 2 (offline) adds runtimeCaching + a background-sync outbox here.
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
        // The PDF/Excel writers are only needed when you actually export, and
        // they are the biggest files in the build — fetch them on demand rather
        // than making every install pay for them up front.
        globIgnores: ['**/jspdf*', '**/html2canvas*', '**/purify*'],
        navigateFallback: `${BASE}index.html`,
        navigateFallbackDenylist: [/^\/api/],
        cleanupOutdatedCaches: true,
      },
      devOptions: { enabled: false },
    }),
  ],
})
