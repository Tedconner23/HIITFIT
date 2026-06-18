import { defineConfig } from 'vitest/config'

// Standalone config so the store tests don't load the Vue/PWA build plugins.
// jsdom provides `localStorage`, which the store reads/writes.
export default defineConfig({
  test: {
    environment: 'jsdom',
  },
})
