<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  useWorkoutsStore,
  emptyWorkout,
  emptyExercise,
} from '../stores/workouts'
import { useSessionsStore } from '../stores/sessions'
import { formatDate } from '../format'

const props = defineProps({ id: { type: String, default: null } })

const store = useWorkoutsStore()
const sessions = useSessionsStore()
const router = useRouter()

const history = computed(() =>
  props.id ? sessions.sessionsFor(props.id) : [],
)

// Edit a copy so changes only persist on Save.
const existing = props.id ? store.get(props.id) : null
const workout = ref(
  existing ? JSON.parse(JSON.stringify(existing)) : emptyWorkout(),
)

function addExercise() {
  workout.value.exercises.push(emptyExercise())
}

function removeExercise(index) {
  workout.value.exercises.splice(index, 1)
}

function save() {
  store.save(workout.value)
  router.push({ name: 'workouts' })
}

function destroy() {
  if (!confirm('Delete this workout? This cannot be undone.')) return
  store.remove(props.id)
  router.push({ name: 'workouts' })
}
</script>

<template>
  <header class="flex items-center justify-between py-6">
    <RouterLink :to="{ name: 'workouts' }" class="text-neutral-400">Cancel</RouterLink>
    <h1 class="text-lg font-semibold">{{ existing ? 'Edit' : 'New' }} workout</h1>
    <button class="font-medium text-white" @click="save">Save</button>
  </header>

  <input
    v-model="workout.name"
    type="text"
    placeholder="Workout name"
    class="mb-6 w-full rounded-2xl bg-neutral-900 px-5 py-4 text-lg outline-none placeholder:text-neutral-600"
  />

  <ul class="flex flex-col gap-4">
    <li
      v-for="(ex, i) in workout.exercises"
      :key="ex.id"
      class="rounded-2xl bg-neutral-900 p-4"
    >
      <div class="mb-3 flex items-center gap-3">
        <input
          v-model="ex.name"
          type="text"
          placeholder="Exercise"
          class="flex-1 bg-transparent text-base outline-none placeholder:text-neutral-600"
        />
        <button
          class="text-sm text-neutral-500"
          @click="removeExercise(i)"
        >
          Remove
        </button>
      </div>
      <div class="flex gap-3">
        <label class="flex flex-1 flex-col gap-1 text-xs text-neutral-500">
          Sets
          <input
            v-model.number="ex.sets"
            type="number"
            min="1"
            class="rounded-lg bg-neutral-800 px-3 py-2 text-base text-neutral-100 outline-none"
          />
        </label>
        <label class="flex flex-1 flex-col gap-1 text-xs text-neutral-500">
          Reps
          <input
            v-model="ex.reps"
            type="text"
            class="rounded-lg bg-neutral-800 px-3 py-2 text-base text-neutral-100 outline-none"
          />
        </label>
      </div>
    </li>
  </ul>

  <button
    class="mt-4 w-full rounded-2xl border border-dashed border-neutral-700 py-4 text-neutral-400"
    @click="addExercise"
  >
    + Add exercise
  </button>

  <section v-if="history.length" class="mt-8">
    <h2 class="mb-3 text-sm font-medium text-neutral-400">History</h2>
    <ul class="flex flex-col gap-2">
      <li
        v-for="s in history"
        :key="s.id"
        class="flex justify-between rounded-xl bg-neutral-900 px-4 py-3 text-sm"
      >
        <span>{{ formatDate(s.completedAt) }}</span>
        <span class="text-neutral-500">{{ s.setsDone }}/{{ s.setsTotal }} sets</span>
      </li>
    </ul>
  </section>

  <button
    v-if="existing"
    class="mt-8 w-full rounded-2xl py-3 text-sm text-red-400"
    @click="destroy"
  >
    Delete workout
  </button>
</template>
