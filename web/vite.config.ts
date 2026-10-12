import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

const api = { target: 'http://127.0.0.1:8000', rewrite: (p: string) => p.replace(/^\/api/, '') }

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.svg', 'icons/*.png', 'figures/*.png'],
      manifest: {
        name: 'DS-15 Hub · Late delivery risk',
        short_name: 'DS-15 Hub',
        description: 'Eight late-delivery models on the DataCo dataset, explained and compared, with a live champion prediction. IT3091 Group 2026-DS-15.',
        theme_color: '#131313',
        background_color: '#F2F2F2',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Docs pages and their data are bundled, so they work offline. Predictions need the API (network only).
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [{ urlPattern: /\/api\//, handler: 'NetworkOnly' }],
      },
    }),
  ],
  build: { chunkSizeWarningLimit: 700 },
  server: { proxy: { '/api': api } },
  preview: { proxy: { '/api': api } },
})
