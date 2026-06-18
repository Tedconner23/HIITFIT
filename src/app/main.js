import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { registerSW } from 'virtual:pwa-register'
import App from './App.vue'
import router from './router'
import { useWorkoutsStore } from './stores/workouts'
import './style.css'

registerSW({ immediate: true })

const pinia = createPinia()
const app = createApp(App)
app.use(pinia)
app.use(router)

// Seed example workouts on first ever run (no-op afterwards).
useWorkoutsStore(pinia).seedIfFirstRun()

app.mount('#app')
