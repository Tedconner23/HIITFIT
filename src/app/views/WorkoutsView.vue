<script setup>
import { ref, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useWorkoutsStore } from '../stores/workouts'
import { useSessionsStore } from '../stores/sessions'
import { formatDate } from '../format'
import SwipeRow from '../components/SwipeRow.vue'

const store = useWorkoutsStore()
const sessions = useSessionsStore()
const fileInput = ref(null)
const tab = ref('reps')

const list = computed(() =>
  store.workouts.filter((w) =>
    tab.value === 'hiit' ? w.type === 'hiit' : w.type !== 'hiit',
  ),
)

function subtitle(w) {
  const at = sessions.lastPerformed(w.id)
  const last = at ? `last ${formatDate(at)}` : 'not performed yet'
  const count =
    w.type === 'hiit'
      ? `${w.rounds} ${w.rounds === 1 ? 'round' : 'rounds'}`
      : `${w.exercises.length} ${w.exercises.length === 1 ? 'exercise' : 'exercises'}`
  return `${count} · ${last}`
}

function confirmDelete(w) {
  if (confirm(`Delete "${w.name || 'Untitled'}"? This cannot be undone.`)) {
    store.remove(w.id)
  }
}

function backup() {
  const payload = { workouts: store.workouts, sessions: sessions.sessions }
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'workouts-backup.json'
  a.click()
  URL.revokeObjectURL(url)
}

async function restore(event) {
  const file = event.target.files[0]
  if (!file) return
  try {
    const data = JSON.parse(await file.text())
    // Legacy backups were a bare array of workouts.
    const workouts = Array.isArray(data) ? data : (data.workouts ?? [])
    let count = store.importMerge(workouts)
    count += sessions.importSessions(Array.isArray(data) ? [] : (data.sessions ?? []))
    alert(count ? `Restored ${count} item(s).` : 'Nothing new to restore.')
  } catch {
    alert("Couldn't read that file.")
  }
  event.target.value = ''
}
</script>

<template>
  <header class="flex items-center justify-between py-6">
    <h1 class="text-2xl font-semibold tracking-tight">Workouts</h1>
    <div class="flex items-center gap-3 text-sm">
      <RouterLink
        :to="{ name: 'consistency' }"
        aria-label="Consistency"
        class="text-neutral-400"
      >
        Progress
      </RouterLink>
      <RouterLink
        :to="{ name: 'settings' }"
        aria-label="Settings"
        class="text-neutral-400"
      >
        Settings
      </RouterLink>
      <RouterLink
        :to="{ name: 'new', query: { type: tab } }"
        class="rounded-full bg-neutral-900 px-4 py-2 font-medium text-white"
      >
        + New
      </RouterLink>
    </div>
  </header>

  <div class="mb-5 flex rounded-full bg-neutral-100 p-1 text-sm">
    <button
      class="flex-1 rounded-full py-2 transition"
      :class="tab === 'reps' ? 'bg-white font-medium shadow-sm' : 'text-neutral-500'"
      @click="tab = 'reps'"
    >
      Reps
    </button>
    <button
      class="flex-1 rounded-full py-2 transition"
      :class="tab === 'hiit' ? 'bg-white font-medium shadow-sm' : 'text-neutral-500'"
      @click="tab = 'hiit'"
    >
      HIIT
    </button>
  </div>

  <p v-if="list.length === 0" class="py-16 text-center text-neutral-400">
    No {{ tab === 'hiit' ? 'HIIT' : 'rep' }} workouts yet.
    Tap <span class="text-neutral-600">+ New</span> to build one.
  </p>

  <ul v-else class="flex flex-col gap-3">
    <li v-for="w in list" :key="w.id">
      <SwipeRow @delete="confirmDelete(w)">
        <RouterLink
          :to="{ name: 'detail', params: { id: w.id } }"
          class="flex items-center justify-between rounded-2xl border border-neutral-200 bg-white px-5 py-4"
        >
          <span>
            <span class="block font-medium">{{ w.name || 'Untitled' }}</span>
            <span class="mt-0.5 block text-sm text-neutral-400">{{ subtitle(w) }}</span>
          </span>
          <span class="text-lg text-neutral-300">›</span>
        </RouterLink>
      </SwipeRow>
    </li>
  </ul>

  <footer class="mt-10 flex justify-center gap-6 text-sm text-neutral-400">
    <button @click="backup">Backup</button>
    <button @click="fileInput.click()">Restore</button>
    <input
      ref="fileInput"
      type="file"
      accept="application/json"
      class="hidden"
      @change="restore"
    />
  </footer>
</template>
