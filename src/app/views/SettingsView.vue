<script setup>
import { RouterLink } from 'vue-router'
import { useSettingsStore } from '../stores/settings'

const { settings } = useSettingsStore()

const toggles = [
  { key: 'sound', label: 'Sound', hint: 'Beeps and countdown cues' },
  { key: 'vibration', label: 'Vibration', hint: 'Haptic buzz on phase changes' },
  { key: 'voice', label: 'Voice', hint: 'Spoken exercise and phase announcements' },
]
</script>

<template>
  <header class="flex items-center justify-between py-6">
    <RouterLink :to="{ name: 'workouts' }" class="text-neutral-400">‹ Workouts</RouterLink>
    <h1 class="text-lg font-semibold">Settings</h1>
    <span class="w-16"></span>
  </header>

  <ul class="flex flex-col gap-3">
    <li
      v-for="t in toggles"
      :key="t.key"
      class="flex items-center justify-between rounded-2xl border border-neutral-200 bg-white px-5 py-4"
    >
      <span>
        <span class="block font-medium">{{ t.label }}</span>
        <span class="mt-0.5 block text-sm text-neutral-400">{{ t.hint }}</span>
      </span>
      <button
        role="switch"
        :aria-checked="settings[t.key]"
        :aria-label="t.label"
        class="relative h-7 w-12 shrink-0 rounded-full transition-colors"
        :class="settings[t.key] ? 'bg-neutral-900' : 'bg-neutral-200'"
        @click="settings[t.key] = !settings[t.key]"
      >
        <span
          class="absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform"
          :class="settings[t.key] ? 'translate-x-5' : 'translate-x-0.5'"
        ></span>
      </button>
    </li>
  </ul>

  <p class="mt-6 text-center text-sm text-neutral-400">
    Cues play while a workout is running. Audio and vibration are best-effort and
    depend on your device.
  </p>
</template>
