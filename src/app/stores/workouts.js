import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

// Local-first storage. Phase B will sync this to Supabase when signed in.
const KEY = 'workouts'
const SEEDED_KEY = 'seeded'

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

  // Clone a workout (new ids, "(copy)" name) so it can be tweaked independently.
  function duplicate(id) {
    const original = get(id)
    if (!original) return null
    const now = new Date().toISOString()
    const copy = JSON.parse(JSON.stringify(original))
    copy.id = crypto.randomUUID()
    copy.name = `${original.name || 'Untitled'} (copy)`
    copy.createdAt = now
    copy.updatedAt = now
    copy.exercises = copy.exercises.map((ex) => ({ ...ex, id: crypto.randomUUID() }))
    workouts.value.push(copy)
    return copy.id
  }

  // Seed a couple of example workouts the very first time the app runs, so a
  // fresh install isn't an empty screen. Called once from the app entry (not in
  // tests). Marks itself done so clearing all workouts later won't re-seed.
  function seedIfFirstRun() {
    if (localStorage.getItem(SEEDED_KEY)) return
    localStorage.setItem(SEEDED_KEY, '1')
    if (workouts.value.length > 0) return
    const now = new Date().toISOString()
    const mk = (o) => ({ id: crypto.randomUUID(), createdAt: now, updatedAt: now, ...o })
    const ex = (o) => ({ id: crypto.randomUUID(), ...o })
    workouts.value.push(
      mk({
        name: 'Full Body',
        type: 'reps',
        exercises: [
          ex({ name: 'Push-ups', sets: 3, reps: '12', rest: 60 }),
          ex({ name: 'Squats', sets: 3, reps: '15', rest: 60 }),
          ex({ name: 'Plank', sets: 3, reps: '30s', rest: 45 }),
        ],
      }),
      mk({
        name: 'Push Day',
        type: 'reps',
        exercises: [
          ex({ name: 'Bench Press', sets: 4, reps: '8', rest: 90 }),
          ex({ name: 'Overhead Press', sets: 3, reps: '10', rest: 75 }),
          ex({ name: 'Incline Dumbbell Press', sets: 3, reps: '10', rest: 75 }),
          ex({ name: 'Lateral Raise', sets: 3, reps: '15', rest: 45 }),
          ex({ name: 'Tricep Dips', sets: 3, reps: '12', rest: 60 }),
        ],
      }),
      mk({
        name: 'Pull Day',
        type: 'reps',
        exercises: [
          ex({ name: 'Pull-ups', sets: 4, reps: '8', rest: 90 }),
          ex({ name: 'Bent-over Row', sets: 3, reps: '10', rest: 75 }),
          ex({ name: 'Lat Pulldown', sets: 3, reps: '12', rest: 60 }),
          ex({ name: 'Face Pull', sets: 3, reps: '15', rest: 45 }),
          ex({ name: 'Bicep Curl', sets: 3, reps: '12', rest: 60 }),
        ],
      }),
      mk({
        name: 'Leg Day',
        type: 'reps',
        exercises: [
          ex({ name: 'Squats', sets: 4, reps: '8', rest: 120 }),
          ex({ name: 'Romanian Deadlift', sets: 3, reps: '10', rest: 90 }),
          ex({ name: 'Bulgarian Split Squat', sets: 3, reps: '10', rest: 75 }),
          ex({ name: 'Leg Curl', sets: 3, reps: '12', rest: 60 }),
          ex({ name: 'Calf Raises', sets: 4, reps: '15', rest: 45 }),
        ],
      }),
      mk({
        name: 'Core Crusher',
        type: 'reps',
        exercises: [
          ex({ name: 'Plank', sets: 3, reps: '45s', rest: 45 }),
          ex({ name: 'Bicycle Crunches', sets: 3, reps: '20', rest: 45 }),
          ex({ name: 'Russian Twists', sets: 3, reps: '20', rest: 45 }),
          ex({ name: 'Leg Raises', sets: 3, reps: '15', rest: 45 }),
        ],
      }),
      mk({
        name: 'Tabata',
        type: 'hiit',
        rounds: 8,
        exercises: [ex({ name: 'Burpees', work: 20, rest: 10 })],
      }),
      mk({
        name: 'HIIT Circuit',
        type: 'hiit',
        rounds: 3,
        exercises: [
          ex({ name: 'Jumping Jacks', work: 40, rest: 20 }),
          ex({ name: 'Mountain Climbers', work: 40, rest: 20 }),
          ex({ name: 'High Knees', work: 40, rest: 20 }),
          ex({ name: 'Squat Jumps', work: 40, rest: 20 }),
        ],
      }),
      mk({
        name: 'Cardio Blast',
        type: 'hiit',
        rounds: 4,
        exercises: [
          ex({ name: 'Burpees', work: 30, rest: 15 }),
          ex({ name: 'Skaters', work: 30, rest: 15 }),
          ex({ name: 'Box Jumps', work: 30, rest: 15 }),
        ],
      }),
    )
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

  return { workouts, get, save, remove, duplicate, seedIfFirstRun, importMerge }
})

export function emptyExercise(type = 'reps') {
  return type === 'hiit'
    ? { id: crypto.randomUUID(), name: '', work: 40, rest: 20 }
    : { id: crypto.randomUUID(), name: '', sets: 3, reps: '10', rest: 60 }
}

export function emptyWorkout(type = 'reps') {
  const workout = { id: null, name: '', type, exercises: [emptyExercise(type)] }
  if (type === 'hiit') workout.rounds = 3
  return workout
}
