<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useWorkoutsStore } from '../stores/workouts'
import { useSessionsStore } from '../stores/sessions'
import { buildTimeline, timelineDuration } from '../hiit'
import { formatDuration } from '../format'

const props = defineProps({ id: { type: String, required: true } })

const store = useWorkoutsStore()
const sessions = useSessionsStore()
const router = useRouter()
const workout = store.get(props.id)

const PREP = 5
const timeline = workout
  ? [{ kind: 'prep', name: 'Get ready', seconds: PREP, round: 0 }, ...buildTimeline(workout)]
  : []
const totalDuration = workout ? timelineDuration(buildTimeline(workout)) : 0

const started = ref(false)
const index = ref(0)
const remaining = ref(timeline[0]?.seconds ?? 0)

const current = computed(() => timeline[index.value] ?? null)
const next = computed(() => timeline[index.value + 1] ?? null)
const panelClass = computed(() => {
  if (current.value?.kind === 'work') return 'bg-neutral-900 text-white'
  return 'bg-neutral-100 text-neutral-900'
})

let intervalEnd = 0
let timerId = null
let audioCtx = null
let wakeLock = null

function beep(freq, dur = 0.15) {
  if (!audioCtx) return
  const o = audioCtx.createOscillator()
  const g = audioCtx.createGain()
  o.type = 'sine'
  o.frequency.value = freq
  o.connect(g)
  g.connect(audioCtx.destination)
  g.gain.setValueAtTime(0.25, audioCtx.currentTime)
  g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur)
  o.start()
  o.stop(audioCtx.currentTime + dur)
}

function start() {
  started.value = true
  // Start the timer synchronously — it must never depend on audio/wake-lock,
  // which are best-effort and can stall on some browsers.
  beginAt(0)
  timerId = setInterval(tick, 200)
  initAudio()
  requestWakeLock()
}

function initAudio() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (!Ctx) return
    audioCtx = new Ctx()
    audioCtx.resume?.()
  } catch {
    audioCtx = null
  }
}

async function requestWakeLock() {
  try {
    wakeLock = (await navigator.wakeLock?.request('screen')) ?? null
  } catch {
    wakeLock = null
  }
}

function beginAt(i) {
  index.value = i
  remaining.value = timeline[i].seconds
  intervalEnd = Date.now() + timeline[i].seconds * 1000
  if (timeline[i].kind === 'work') beep(880, 0.18)
}

function tick() {
  const secLeft = Math.max(0, Math.ceil((intervalEnd - Date.now()) / 1000))
  if (secLeft <= 0) {
    if (index.value < timeline.length - 1) beginAt(index.value + 1)
    else finish()
    return
  }
  if (secLeft !== remaining.value) {
    remaining.value = secLeft
    if (secLeft <= 3) beep(660, 0.1) // 3-2-1 cue into the next interval
  }
}

function cleanup() {
  if (timerId) clearInterval(timerId)
  timerId = null
  try {
    wakeLock?.release()
  } catch {
    // ignore
  }
  wakeLock = null
}

function finish() {
  cleanup()
  beep(990, 0.4)
  sessions.recordHiitSession(workout)
  router.push({ name: 'detail', params: { id: workout.id } })
}

function quit() {
  cleanup()
  router.push({ name: 'detail', params: { id: workout.id } })
}

onUnmounted(cleanup)
</script>

<template>
  <p v-if="!workout" class="py-12 text-center text-neutral-400">Workout not found.</p>

  <template v-else-if="!started">
    <header class="flex items-center justify-between py-6">
      <RouterLink :to="{ name: 'detail', params: { id: workout.id } }" class="text-neutral-400">
        ‹ Back
      </RouterLink>
      <span class="text-sm text-neutral-400">{{ formatDuration(totalDuration) }}</span>
    </header>

    <h1 class="text-2xl font-semibold tracking-tight">{{ workout.name || 'Untitled' }}</h1>
    <p class="mt-1 text-sm text-neutral-400">
      {{ workout.rounds }} rounds · {{ workout.exercises.length }}
      {{ workout.exercises.length === 1 ? 'exercise' : 'exercises' }}
    </p>

    <button
      class="mt-8 w-full rounded-2xl bg-neutral-900 py-4 font-medium text-white"
      @click="start"
    >
      Start
    </button>

    <ul class="mt-6 flex flex-col gap-2">
      <li
        v-for="ex in workout.exercises"
        :key="ex.id"
        class="flex items-center justify-between rounded-xl border border-neutral-200 bg-white px-4 py-3"
      >
        <span class="font-medium">{{ ex.name || 'Exercise' }}</span>
        <span class="text-sm text-neutral-400">{{ ex.work }}s work · {{ ex.rest }}s rest</span>
      </li>
    </ul>
  </template>

  <div v-else class="flex flex-col">
    <header class="flex items-center justify-between py-6">
      <button class="text-neutral-400" @click="quit">Stop</button>
      <span v-if="current && current.round" class="text-sm text-neutral-400">
        Round {{ current.round }} / {{ workout.rounds }}
      </span>
    </header>

    <div
      class="flex min-h-[60vh] flex-col items-center justify-center gap-4 rounded-3xl p-8 text-center transition-colors"
      :class="panelClass"
    >
      <p class="text-sm uppercase tracking-widest opacity-60">
        {{ current?.kind === 'work' ? 'Work' : current?.kind === 'rest' ? 'Rest' : 'Get ready' }}
      </p>
      <p class="text-2xl font-semibold">{{ current?.name }}</p>
      <p class="text-7xl font-bold tabular-nums">{{ remaining }}</p>
      <p class="opacity-60">
        <template v-if="next">Next: {{ next.name }}</template>
        <template v-else>Last one!</template>
      </p>
    </div>
  </div>
</template>
