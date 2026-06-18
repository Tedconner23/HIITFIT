import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

// Local-first storage. Phase B will sync this to Supabase when signed in.
const KEY = 'workouts'

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) ?? []
  } catch {
    return []
  }
}

export const useWorkoutsStore = defineStore('workouts', () => {
  const workouts = ref(load())

  watch(
    workouts,
    (value) => localStorage.setItem(KEY, JSON.stringify(value)),
    { deep: true },
  )

  function get(id) {
    return workouts.value.find((w) => w.id === id)
  }

  // Insert or update by id. Returns the saved workout's id.
  function save(workout) {
    const now = new Date().toISOString()
    const existing = get(workout.id)
    if (existing) {
      Object.assign(existing, workout, { updatedAt: now })
      return existing.id
    }
    workouts.value.push({
      ...workout,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    })
    return workouts.value[workouts.value.length - 1].id
  }

  function remove(id) {
    workouts.value = workouts.value.filter((w) => w.id !== id)
  }

  // Merge imported workouts by id; newer `updatedAt` wins. Returns count added/updated.
  function importMerge(list) {
    if (!Array.isArray(list)) throw new Error('Invalid backup file')
    let changed = 0
    for (const w of list) {
      if (!w?.id || !Array.isArray(w.exercises)) continue
      const existing = get(w.id)
      if (!existing) {
        workouts.value.push(w)
        changed++
      } else if (new Date(w.updatedAt) > new Date(existing.updatedAt)) {
        Object.assign(existing, w)
        changed++
      }
    }
    return changed
  }

  return { workouts, get, save, remove, importMerge }
})

export function emptyExercise(type = 'reps') {
  return type === 'hiit'
    ? { id: crypto.randomUUID(), name: '', work: 40, rest: 20 }
    : { id: crypto.randomUUID(), name: '', sets: 3, reps: '10' }
}

export function emptyWorkout(type = 'reps') {
  const workout = { id: null, name: '', type, exercises: [emptyExercise(type)] }
  if (type === 'hiit') workout.rounds = 3
  return workout
}
