import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

// User preferences for the automated cues. Local-first, same persistence
// pattern as the other stores. Unknown/missing keys fall back to the defaults
// so older stored blobs keep working as new toggles are added.
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
  const settings = ref(load())

  watch(
    settings,
    (value) => localStorage.setItem(KEY, JSON.stringify(value)),
    { deep: true },
  )

  return { settings }
})
