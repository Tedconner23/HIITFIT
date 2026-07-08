<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useWorkoutsStore } from '../stores/workouts'
import { useSessionsStore } from '../stores/sessions'
import { useSettingsStore } from '../stores/settings'
import { formatDuration } from '../format'

const props = defineProps({ id: { type: String, required: true } })

const store = useWorkoutsStore()
const sessions = useSessionsStore()
const { settings } = useSettingsStore()
const router = useRouter()
const workout = store.get(props.id)

// When this perform began, to record how long the session took.
const startedAt = Date.now()

// Seed from any saved in-progress state so leaving and returning resumes.
// Keys are `${exerciseId}:${setIndex}`.
const done = ref(new Set(workout ? sessions.getProgress(workout.id) : []))

// Rest timer (starts when a set is checked off, if the exercise has a rest).
const restRemaining = ref(0)
let restEnd = 0
let restTimer = null
let audioCtx = null

function key(exId, setIndex) {
  return `${exId}:${setIndex}`
}

function ensureAudio() {
  if (audioCtx) return
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext
    audioCtx = Ctx ? new Ctx() : null
    audioCtx?.resume?.()
  } catch {
    audioCtx = null
  }
}

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

function startRest(seconds) {
  restRemaining.value = seconds
  restEnd = Date.now() + seconds * 1000
  if (restTimer) clearInterval(restTimer)
  restTimer = setInterval(restTick, 200)
}

function restTick() {
  const left = Math.max(0, Math.ceil((restEnd - Date.now()) / 1000))
  if (left <= 0) {
    stopRest()
    beep(880, 0.3)
    return
  }
  if (left !== restRemaining.value) {
    restRemaining.value = left
    if (left <= 3) beep(660, 0.1)
  }
}

function addRest(seconds) {
  restEnd += seconds * 1000
  restRemaining.value = Math.max(0, Math.ceil((restEnd - Date.now()) / 1000))
}

function stopRest() {
  if (restTimer) clearInterval(restTimer)
  restTimer = null
  restRemaining.value = 0
}

function toggle(exId, setIndex) {
  ensureAudio()
  const k = key(exId, setIndex)
  const adding = !done.value.has(k)
  if (adding) done.value.add(k)
  else done.value.delete(k)
  // Reassign so Vue tracks the Set mutation.
  done.value = new Set(done.value)
  sessions.setProgress(workout.id, [...done.value])
  if (adding) {
    const ex = workout.exercises.find((e) => e.id === exId)
    const rest = Number(ex?.rest) || 0
    if (rest > 0) startRest(rest)
  }
}

function finish() {
  stopRest()
  const seconds = Math.round((Date.now() - startedAt) / 1000)
  sessions.recordSession(workout, [...done.value], seconds)
  done.value = new Set()
  router.push({ name: 'detail', params: { id: workout.id } })
}

const totalSets = computed(() =>
  workout ? workout.exercises.reduce((n, ex) => n + (Number(ex.sets) || 0), 0) : 0,
)

onUnmounted(stopRest)
</script>

<template>
  <template v-if="workout">
    <header class="flex items-center justify-between py-6">
      <RouterLink
        :to="{ name: 'detail', params: { id: workout.id } }"
        class="text-neutral-400"
      >
        Close
      </RouterLink>
      <span class="text-sm text-neutral-400">{{ done.size }} / {{ totalSets }}</span>
      <button
        class="font-medium"
        :class="done.size ? 'text-neutral-900' : 'text-neutral-300'"
        :disabled="!done.size"
        @click="finish"
      >
        Finish
      </button>
    </header>

    <h1 class="mb-6 text-2xl font-semibold tracking-tight">
      {{ workout.name || 'Untitled' }}
    </h1>

    <ul class="flex flex-col gap-4">
      <li
        v-for="ex in workout.exercises"
        :key="ex.id"
        class="rounded-2xl border border-neutral-200 bg-white p-4"
      >
        <div class="mb-3 flex items-baseline justify-between">
          <p class="font-medium">{{ ex.name || 'Exercise' }}</p>
          <p class="text-sm text-neutral-400">{{ ex.reps }} reps</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="n in Number(ex.sets) || 0"
            :key="n"
            class="h-11 w-11 rounded-xl text-sm font-medium transition"
            :class="
              done.has(key(ex.id, n))
                ? 'bg-neutral-900 text-white'
                : 'border border-neutral-200 bg-white text-neutral-400'
            "
            @click="toggle(ex.id, n)"
          >
            {{ n }}
          </button>
        </div>
      </li>
    </ul>

    <!-- spacer so the rest bar doesn't cover the last exercise -->
    <div v-if="restRemaining > 0" class="h-24"></div>

    <div
      v-if="restRemaining > 0"
      class="fixed inset-x-0 bottom-0 px-5"
      style="padding-bottom: max(1rem, env(safe-area-inset-bottom))"
    >
      <div
        class="mx-auto flex max-w-md items-center justify-between gap-3 rounded-2xl bg-neutral-900 px-5 py-3 text-white shadow-lg"
      >
        <span class="text-sm">Rest · {{ formatDuration(restRemaining) }}</span>
        <div class="flex gap-2">
          <button
            class="rounded-full bg-white/15 px-3 py-1 text-sm"
            @click="addRest(15)"
          >
            +15s
          </button>
          <button
            class="rounded-full bg-white px-3 py-1 text-sm font-medium text-neutral-900"
            @click="stopRest"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  </template>

  <p v-else class="py-12 text-center text-neutral-400">Workout not found.</p>
</template>
