<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  useWorkoutsStore,
  emptyWorkout,
  emptyExercise,
} from '../stores/workouts'

const props = defineProps({ id: { type: String, default: null } })

const store = useWorkoutsStore()
const router = useRouter()

// Edit a copy so changes only persist on Save.
const existing = props.id ? store.get(props.id) : null
const workout = ref(
  existing ? JSON.parse(JSON.stringify(existing)) : emptyWorkout(),
)

function leaveTo() {
  return props.id ? { name: 'detail', params: { id: props.id } } : { name: 'workouts' }
}

function addExercise() {
  workout.value.exercises.push(emptyExercise())
}

function removeExercise(index) {
  workout.value.exercises.splice(index, 1)
}

function save() {
  store.save(workout.value)
  router.push(leaveTo())
}

function destroy() {
  if (!confirm('Delete this workout? This cannot be undone.')) return
  store.remove(props.id)
  router.push({ name: 'workouts' })
}
</script>

<template>
  <header class="flex items-center justify-between py-6">
    <RouterLink :to="leaveTo()" class="text-neutral-400">Cancel</RouterLink>
    <h1 class="text-lg font-semibold">{{ existing ? 'Edit' : 'New' }} workout</h1>
    <button class="font-medium text-neutral-900" @click="save">Save</button>
  </header>

  <input
    v-model="workout.name"
    type="text"
    placeholder="Workout name"
    class="mb-6 w-full rounded-2xl border border-neutral-200 bg-white px-5 py-4 text-lg outline-none placeholder:text-neutral-400 focus:border-neutral-400"
  />

  <ul class="flex flex-col gap-4">
    <li
      v-for="(ex, i) in workout.exercises"
      :key="ex.id"
      class="rounded-2xl border border-neutral-200 bg-white p-4"
    >
      <div class="mb-3 flex items-center gap-3">
        <input
          v-model="ex.name"
          type="text"
          placeholder="Exercise"
          class="flex-1 bg-transparent text-base outline-none placeholder:text-neutral-400"
        />
        <button class="text-sm text-neutral-400" @click="removeExercise(i)">
          Remove
        </button>
      </div>
      <div class="flex gap-3">
        <label class="flex flex-1 flex-col gap-1 text-xs text-neutral-400">
          Sets
          <input
            v-model.number="ex.sets"
            type="number"
            min="1"
            class="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-base text-neutral-900 outline-none focus:border-neutral-400"
          />
        </label>
        <label class="flex flex-1 flex-col gap-1 text-xs text-neutral-400">
          Reps
          <input
            v-model="ex.reps"
            type="text"
            class="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-base text-neutral-900 outline-none focus:border-neutral-400"
          />
        </label>
      </div>
    </li>
  </ul>

  <button
    class="mt-4 w-full rounded-2xl border border-dashed border-neutral-300 py-4 text-neutral-500"
    @click="addExercise"
  >
    + Add exercise
  </button>

  <button
    v-if="existing"
    class="mt-8 w-full rounded-2xl py-3 text-sm text-red-600"
    @click="destroy"
  >
    Delete workout
  </button>
</template>
