<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useWorkoutsStore } from '../stores/workouts'
import { useSessionsStore } from '../stores/sessions'

const props = defineProps({ id: { type: String, required: true } })

const store = useWorkoutsStore()
const sessions = useSessionsStore()
const router = useRouter()
const workout = store.get(props.id)

// Seed from any saved in-progress state so leaving and returning resumes.
// Keys are `${exerciseId}:${setIndex}`.
const done = ref(new Set(workout ? sessions.getProgress(workout.id) : []))

function key(exId, setIndex) {
  return `${exId}:${setIndex}`
}

function toggle(exId, setIndex) {
  const k = key(exId, setIndex)
  if (done.value.has(k)) done.value.delete(k)
  else done.value.add(k)
  // Reassign so Vue tracks the Set mutation.
  done.value = new Set(done.value)
  sessions.setProgress(workout.id, [...done.value])
}

function finish() {
  sessions.recordSession(workout, [...done.value])
  done.value = new Set()
  router.push({ name: 'detail', params: { id: workout.id } })
}

const totalSets = computed(() =>
  workout ? workout.exercises.reduce((n, ex) => n + (Number(ex.sets) || 0), 0) : 0,
)
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
  </template>

  <p v-else class="py-12 text-center text-neutral-400">Workout not found.</p>
</template>
