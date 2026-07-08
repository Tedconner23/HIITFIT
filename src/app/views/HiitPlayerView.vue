<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useWorkoutsStore } from '../stores/workouts'
import { useSessionsStore } from '../stores/sessions'
import { useSettingsStore } from '../stores/settings'
import { buildTimeline, timelineDuration, phasePanelClass } from '../hiit'
import { formatDuration } from '../format'

const props = defineProps({ id: { type: String, required: true } })

const store = useWorkoutsStore()
const sessions = useSessionsStore()
const { settings } = useSettingsStore()
const router = useRouter()
const workout = store.get(props.id)

const PREP = 5
const timeline = workout
  ? [{ kind: 'prep', name: 'Get ready', seconds: PREP, round: 0 }, ...buildTimeline(workout)]
  : []
const totalDuration = workout ? timelineDuration(buildTimeline(workout)) : 0
// Whole timeline including the lead-in, so elapsed reaches this at the finish.
const grandTotal = timelineDuration(timeline)
// Everything the user actually performs (the "Interval N / M" denominator).
const intervalTotal = timeline.filter((it) => it.kind !== 'prep').length

const started = ref(false)
const paused = ref(false)
const index = ref(0)
const remaining = ref(timeline[0]?.seconds ?? 0)

const current = computed(() => timeline[index.value] ?? null)
const next = computed(() => timeline[index.value + 1] ?? null)
// Full-screen color-coded phase panel — matches the native app's phase colors.
const panelClass = computed(() => phasePanelClass(current.value?.kind))
const phaseLabel = computed(() => {
  switch (current.value?.kind) {
    case 'work': return 'Work'
    case 'rest': return 'Rest'
    case 'warmup': return 'Warm-up'
    case 'cooldown': return 'Cool-down'
    default: return 'Get ready'
  }
})
// The prep lead-in is index 0; performed intervals are 1-based after it.
const intervalNumber = computed(() => Math.max(0, Math.min(index.value, intervalTotal)))
const elapsed = computed(() => {
  let e = 0
  for (let i = 0; i < index.value; i++) e += timeline[i].seconds
  e += (timeline[index.value]?.seconds ?? 0) - remaining.value
  return Math.max(0, e)
})

let intervalEnd = 0
let timerId = null
let audioCtx = null
let wakeLock = null

function beep(freq, dur = 0.15) {
  if (!audioCtx || !settings.sound) return
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

function vibrate(ms) {
  if (!settings.vibration) return
  try {
    navigator.vibrate?.(ms)
  } catch {
    // ignore
  }
}

// Spoken cues via the browser's speech synthesis — no dependencies.
function speak(text) {
  if (!settings.voice) return
  try {
    const synth = window.speechSynthesis
    if (!synth) return
    synth.cancel()
    synth.speak(new SpeechSynthesisUtterance(text))
  } catch {
    // ignore
  }
}

function announce(item) {
  switch (item?.kind) {
    case 'work': return speak(`Work. ${item.name}`)
    case 'rest': return speak('Rest')
    case 'warmup': return speak('Warm up')
    case 'cooldown': return speak('Cool down')
    case 'prep': return speak('Get ready')
  }
}

function beginAt(i) {
  index.value = i
  remaining.value = timeline[i].seconds
  intervalEnd = Date.now() + timeline[i].seconds * 1000
  vibrate(timeline[i].kind === 'work' ? 80 : 40)
  if (timeline[i].kind === 'work') beep(880, 0.18)
  announce(timeline[i])
}

function togglePause() {
  if (paused.value) {
    intervalEnd = Date.now() + remaining.value * 1000
    paused.value = false
  } else {
    paused.value = true
  }
}

function skip() {
  if (index.value < timeline.length - 1) beginAt(index.value + 1)
  else finish()
}

function tick() {
  if (paused.value) return
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
  try {
    window.speechSynthesis?.cancel()
  } catch {
    // ignore
  }
}

function finish() {
  cleanup()
  beep(990, 0.4)
  speak('Workout complete')
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
      <p class="text-sm uppercase tracking-widest opacity-60">{{ phaseLabel }}</p>
      <p class="text-2xl font-semibold">{{ current?.name }}</p>
      <p class="text-7xl font-bold tabular-nums">{{ remaining }}</p>
      <p class="opacity-60">
        <template v-if="next">Next: {{ next.name }}</template>
        <template v-else>Last one!</template>
      </p>
    </div>

    <div class="mt-4 flex items-center justify-between text-sm text-neutral-400">
      <span class="tabular-nums">
        {{ formatDuration(elapsed) }} / {{ formatDuration(grandTotal) }}
      </span>
      <span v-if="intervalNumber >= 1" class="tabular-nums">
        Interval {{ intervalNumber }} / {{ intervalTotal }}
      </span>
      <span v-else class="tabular-nums">Get ready</span>
    </div>

    <div class="mt-2 h-1.5 overflow-hidden rounded-full bg-neutral-200">
      <div
        class="h-full bg-neutral-900 transition-all"
        :style="{ width: `${grandTotal ? (elapsed / grandTotal) * 100 : 0}%` }"
      ></div>
    </div>

    <div class="mt-4 flex gap-3">
      <button
        class="flex-1 rounded-2xl border border-neutral-200 py-3 font-medium"
        @click="togglePause"
      >
        {{ paused ? 'Resume' : 'Pause' }}
      </button>
      <button
        class="flex-1 rounded-2xl border border-neutral-200 py-3 font-medium"
        @click="skip"
      >
        Skip
      </button>
    </div>
  </div>
</template>
