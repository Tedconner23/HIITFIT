import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { registerSW } from 'virtual:pwa-register'
import App from './App.vue'
import router from './router'
import { useWorkoutsStore } from './stores/workouts'
import { useAuthStore } from './stores/auth'
import { installAutoSync } from './sync'
import './style.css'

registerSW({ immediate: true })

// Dev-only: surface uncaught errors on screen. Phones testing over LAN have no
// devtools console, so a runtime error otherwise looks like a silent blank page.
function showDevError(msg) {
  const el = document.createElement('div')
  el.textContent = `⚠ ${msg}`
  el.style.cssText =
    'position:fixed;bottom:0;left:0;right:0;z-index:9999;background:#dc2626;color:#fff;' +
    'font:12px/1.4 monospace;padding:8px 12px;white-space:pre-wrap;word-break:break-all'
  el.onclick = () => el.remove()
  document.body.appendChild(el)
}
if (import.meta.env.DEV) {
  window.addEventListener('error', (e) => showDevError(e.message))
  window.addEventListener('unhandledrejection', (e) => showDevError(String(e.reason)))
}

const pinia = createPinia()
const app = createApp(App)
app.use(pinia)
app.use(router)

if (import.meta.env.DEV) {
  app.config.errorHandler = (err, _instance, info) => {
    console.error(err)
    showDevError(`[${info}] ${err}`)
  }
}

// Seed example workouts on first ever run (no-op afterwards).
useWorkoutsStore(pinia).seedIfFirstRun()

// Cloud auth + sync (no-ops when Supabase env isn't configured).
useAuthStore(pinia).init()
installAutoSync()

app.mount('#app')
