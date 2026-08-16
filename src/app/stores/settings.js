import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

// Player cue preferences (sound / vibration / voice). Local-first like the rest
// of the app; all default on. Read by the HIIT player to gate each cue.
const KEY = 'settings'
const DEFAULTS = { sound: true, vibration: true, voice: true }

function load() {
  try {
    return { ...DEFAULTS, ...(JSON.parse(localStorage.getItem(KEY)) ?? {}) }
  } catch {
    return { ...DEFAULTS }
  }
}

export const useSettingsStore = defineStore('settings', () => {
  const loaded = load()
  const sound = ref(loaded.sound)
  const vibration = ref(loaded.vibration)
  const voice = ref(loaded.voice)

  watch([sound, vibration, voice], () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({ sound: sound.value, vibration: vibration.value, voice: voice.value }),
    )
  })

  return { sound, vibration, voice }
})
