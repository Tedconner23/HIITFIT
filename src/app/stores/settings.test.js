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
    const s = useSettingsStore()
    expect(s.sound).toBe(true)
    expect(s.vibration).toBe(true)
    expect(s.voice).toBe(true)
  })

  it('persists changes to localStorage', async () => {
    const s = useSettingsStore()
    s.voice = false
    await nextTick() // watchers flush async
    expect(JSON.parse(localStorage.getItem('settings')).voice).toBe(false)
  })

  it('reloads persisted values, keeping defaults for missing keys', () => {
    localStorage.setItem('settings', JSON.stringify({ sound: false }))
    setActivePinia(createPinia())
    const s = useSettingsStore()
    expect(s.sound).toBe(false)
    expect(s.vibration).toBe(true) // absent in storage → default
  })
})
