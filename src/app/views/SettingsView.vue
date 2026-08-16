<script setup>
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useSettingsStore } from '../stores/settings'
import { useAuthStore } from '../stores/auth'
import { isSupabaseConfigured } from '../supabase'
import { syncNow, syncStatus } from '../sync'

const { settings } = useSettingsStore()
const auth = useAuthStore()

const toggles = [
  { key: 'sound', label: 'Sound', hint: 'Beeps and countdown cues' },
  { key: 'vibration', label: 'Vibration', hint: 'Haptic buzz on phase changes' },
  { key: 'voice', label: 'Voice', hint: 'Spoken exercise and phase announcements' },
]

const email = ref('')
const password = ref('')
const busy = ref(false)
const message = ref('')

async function run(fn) {
  busy.value = true
  message.value = ''
  try {
    await fn()
  } catch (e) {
    message.value = e.message ?? String(e)
  }
  busy.value = false
}

const signIn = () => run(() => auth.signIn(email.value.trim(), password.value))
const signUp = () =>
  run(async () => {
    const signedIn = await auth.signUp(email.value.trim(), password.value)
    if (!signedIn) message.value = 'Check your email to confirm your account, then sign in.'
  })
const signOut = () => run(() => auth.signOut())
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

  <h2 class="mt-8 mb-4 text-sm text-neutral-400">Account &amp; sync</h2>

  <p
    v-if="!isSupabaseConfigured()"
    class="rounded-2xl border border-dashed border-neutral-300 px-5 py-4 text-sm text-neutral-400"
  >
    Cloud sync isn't configured. Workouts are stored on this device only — use
    Backup on the workouts screen to export them.
  </p>

  <div
    v-else-if="auth.user"
    class="flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white px-5 py-4"
  >
    <div class="flex items-center justify-between">
      <span>
        <span class="block font-medium">{{ auth.user.email }}</span>
        <span class="mt-0.5 block text-sm text-neutral-400">
          <template v-if="syncStatus.state === 'syncing'">Syncing…</template>
          <template v-else-if="syncStatus.state === 'error'">
            Sync failed: {{ syncStatus.error }}
          </template>
          <template v-else-if="syncStatus.at">Synced</template>
          <template v-else>Signed in</template>
        </span>
      </span>
      <button
        class="rounded-full border border-neutral-200 px-4 py-2 text-sm"
        :disabled="busy || syncStatus.state === 'syncing'"
        @click="syncNow"
      >
        Sync now
      </button>
    </div>
    <button class="text-left text-sm text-red-600" :disabled="busy" @click="signOut">
      Sign out
    </button>
  </div>

  <div v-else class="flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white px-5 py-4">
    <p class="text-sm text-neutral-400">
      Sign in to back up your workouts and sync them across devices.
    </p>
    <input
      v-model="email"
      type="email"
      placeholder="Email"
      autocomplete="email"
      class="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-base outline-none focus:border-neutral-400"
    />
    <input
      v-model="password"
      type="password"
      placeholder="Password"
      autocomplete="current-password"
      class="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-base outline-none focus:border-neutral-400"
    />
    <div class="flex gap-3">
      <button
        class="flex-1 rounded-xl bg-neutral-900 py-2.5 text-sm font-medium text-white disabled:opacity-50"
        :disabled="busy || !email || !password"
        @click="signIn"
      >
        Sign in
      </button>
      <button
        class="flex-1 rounded-xl border border-neutral-200 py-2.5 text-sm font-medium disabled:opacity-50"
        :disabled="busy || !email || !password"
        @click="signUp"
      >
        Create account
      </button>
    </div>
    <p v-if="message" class="text-sm text-red-600">{{ message }}</p>
  </div>
</template>
