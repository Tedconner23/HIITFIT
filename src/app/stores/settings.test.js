import { describe, it, expect, beforeEach } from 'vitest'
import { nextTick } from 'vue'
import { setActivePinia, createPinia } from 'pinia'
import { useSettingsStore } from './settings'

describe('settings store', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('defaults all cues on', () => {
    const { settings } = useSettingsStore()
    expect(settings.sound).toBe(true)
    expect(settings.vibration).toBe(true)
    expect(settings.voice).toBe(true)
  })

  it('persists changes to localStorage', async () => {
    const { settings } = useSettingsStore()
    settings.voice = false
    await nextTick() // watchers flush async
    expect(JSON.parse(localStorage.getItem('settings')).voice).toBe(false)
  })

  it('reloads persisted values, keeping defaults for missing keys', () => {
    localStorage.setItem('settings', JSON.stringify({ sound: false }))
    setActivePinia(createPinia())
    const { settings } = useSettingsStore()
    expect(settings.sound).toBe(false)
    expect(settings.vibration).toBe(true) // absent in storage → default
  })
})
