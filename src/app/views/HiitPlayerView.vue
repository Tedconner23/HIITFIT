<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useWorkoutsStore } from '../stores/workouts'
import { useSessionsStore } from '../stores/sessions'
import { useSettingsStore } from '../stores/settings'
import { buildTimeline, timelineDuration, phaseLabel } from '../hiit'
import { formatDuration } from '../format'

const props = defineProps({ id: { type: String, required: true } })

const store = useWorkoutsStore()
const sessions = useSessionsStore()
const settings = useSettingsStore()
const router = useRouter()
const workout = store.get(props.id)

const PREP = 5
const timeline = workout
  ? [{ kind: 'prep', name: 'Get ready', seconds: PREP, round: 0 }, ...buildTimeline(workout)]
  : []
const totalDuration = workout ? timelineDuration(buildTimeline(workout)) : 0

// Non-prep seconds elapsed before each interval — the basis for the progress
// bar and elapsed/remaining readouts (the 5s prep lead-in isn't counted).
const cumulativeBefore = []
{
  let acc = 0
  for (const it of timeline) {
    cumulativeBefore.push(acc)
    if (it.kind !== 'prep') acc += it.seconds
  }
}
const totalWork = timeline.filter((it) => it.kind === 'work').length

const started = ref(false)
const paused = ref(false)
const index = ref(0)
const remaining = ref(timeline[0]?.seconds ?? 0)

const current = computed(() => timeline[index.value] ?? null)
const next = computed(() => timeline[index.value + 1] ?? null)
const panelClass = computed(() => {
  switch (current.value?.kind) {
    case 'work':
      return 'bg-neutral-900 text-white'
    case 'warmup':
      return 'bg-amber-100 text-amber-900'
    case 'cooldown':
      return 'bg-sky-100 text-sky-900'
    default: // rest, prep
      return 'bg-neutral-100 text-neutral-900'
  }
})

// How many work intervals have started (used for "Interval X / N").
const workNumber = computed(
  () => timeline.slice(0, index.value + 1).filter((it) => it.kind === 'work').length,
)
const elapsed = computed(() => {
  const c = current.value
  if (!c) return totalDuration
  const within = c.kind === 'prep' ? 0 : c.seconds - remaining.value
  return cumulativeBefore[index.value] + within
})
const remainingTotal = computed(() => Math.max(0, totalDuration - elapsed.value))
const progressPct = computed(() =>
  totalDuration ? Math.min(100, (elapsed.value / totalDuration) * 100) : 0,
)

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

// Speak a short cue. Best-effort: unlocked by the Start tap (a user gesture),
// silent where speechSynthesis is unavailable or the voice cue is off.
function speak(text) {
  if (!settings.voice) return
  try {
    const synth = window.speechSynthesis
    if (!synth) return
    synth.cancel() // don't let cues queue up and lag behind the timer
    const u = new SpeechSynthesisUtterance(text)
    u.rate = 1.05
    synth.speak(u)
  } catch {
    // ignore
  }
}

function upcomingWorkName(from) {
  for (let i = from + 1; i < timeline.length; i++) {
    if (timeline[i].kind === 'work') return timeline[i].name
  }
  return null
}

function announce(i) {
  const item = timeline[i]
  switch (item.kind) {
    case 'work':
      return speak(item.name)
    case 'rest': {
      const nextWork = upcomingWorkName(i)
      return speak(nextWork ? `Rest. Next up, ${nextWork}` : 'Rest')
    }
    case 'warmup':
      return speak('Warm up')
    case 'cooldown':
      return speak('Cool down')
    case 'prep':
      return speak('Get ready')
  }
}

function beginAt(i) {
  index.value = i
  remaining.value = timeline[i].seconds
  intervalEnd = Date.now() + timeline[i].seconds * 1000
  vibrate(timeline[i].kind === 'work' ? 80 : 40)
  if (timeline[i].kind === 'work') beep(880, 0.18)
  announce(i)
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
        {{ phaseLabel(current?.kind) }}
      </p>
      <p class="text-2xl font-semibold">{{ current?.name }}</p>
      <p class="text-7xl font-bold tabular-nums">{{ remaining }}</p>
      <p class="opacity-60">
        <template v-if="next">Next: {{ next.name }}</template>
        <template v-else>Last one!</template>
      </p>
    </div>

    <div class="mt-4">
      <div class="h-1.5 w-full overflow-hidden rounded-full bg-neutral-200">
        <div
          class="h-full rounded-full bg-neutral-900 transition-all duration-200"
          :style="{ width: progressPct + '%' }"
        ></div>
      </div>
      <div class="mt-1.5 flex justify-between text-xs tabular-nums text-neutral-400">
        <span>{{ formatDuration(elapsed) }}</span>
        <span v-if="totalWork">Interval {{ workNumber }} / {{ totalWork }}</span>
        <span>-{{ formatDuration(remainingTotal) }}</span>
      </div>
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
