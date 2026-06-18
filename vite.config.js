import { defineConfig } from 'vite'
import { resolve } from 'node:path'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// Serves `/app/index.html` for SPA deep links like `/app/new` during dev.
// MPA mode otherwise only serves the SPA at exactly `/app/`. Mirrored in
// production by the rewrite in vercel.json.
function appSpaFallback() {
  return {
    name: 'app-spa-fallback',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        const path = (req.url || '').split('?')[0]
        if (path.startsWith('/app/') && !path.slice(5).includes('.')) {
          req.url = '/app/index.html'
        }
        next()
      })
    },
  }
}

// Multi-page app: static landing at `/`, Vue SPA at `/app/` with its own
// PWA scope so it installs to the home screen independently of the landing page.
export default defineConfig({
  plugins: [
    appSpaFallback(),
    vue(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false, // registered manually in the app entry only
      scope: '/app/',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Workout',
        short_name: 'Workout',
        start_url: '/app/',
        scope: '/app/',
        display: 'standalone',
        background_color: '#fafafa',
        theme_color: '#fafafa',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        app: resolve(__dirname, 'app/index.html'),
      },
    },
  },
})
