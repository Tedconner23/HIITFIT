import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { uid } from '../uid'
import { isSupabaseConfigured, fetchPresets } from '../supabase'

// Local-first storage; localStorage remains the source of truth. When signed
// in, sync.js mirrors this to Supabase (last-write-wins by updatedAt).
const KEY = 'workouts'
const SEEDED_KEY = 'seeded'
const REMOVED_KEY = 'removedWorkouts'

function load(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback
  } catch {
    return fallback
  }
}

export const useWorkoutsStore = defineStore('workouts', () => {
  const workouts = ref(load(KEY, []))
  // Tombstones: ids deleted locally but possibly still on the server. Cleared
  // by sync.js once the remote delete succeeds.
  const removedIds = ref(load(REMOVED_KEY, []))

  watch(
    workouts,
    (value) => localStorage.setItem(KEY, JSON.stringify(value)),
    { deep: true },
  )
  watch(
    removedIds,
    (value) => localStorage.setItem(REMOVED_KEY, JSON.stringify(value)),
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
      id: uid(),
      createdAt: now,
      updatedAt: now,
    })
    return workouts.value[workouts.value.length - 1].id
  }

  function remove(id) {
    workouts.value = workouts.value.filter((w) => w.id !== id)
    if (!removedIds.value.includes(id)) removedIds.value.push(id)
  }

  function clearRemoved(ids) {
    removedIds.value = removedIds.value.filter((id) => !ids.includes(id))
  }

  // Apply the local half of a sync plan (see sync.js planSync).
  function applySyncPlan(plan) {
    if (plan.dropLocal.length) {
      const drop = new Set(plan.dropLocal)
      workouts.value = workouts.value.filter((w) => !drop.has(w.id))
    }
    for (const w of plan.addLocal) workouts.value.push(w)
    for (const w of plan.updateLocal) {
      const existing = get(w.id)
      if (existing) Object.assign(existing, w)
    }
  }

  // Clone a workout (new ids, "(copy)" name) so it can be tweaked independently.
  function duplicate(id) {
    const original = get(id)
    if (!original) return null
    const now = new Date().toISOString()
    const copy = JSON.parse(JSON.stringify(original))
    copy.id = uid()
    copy.name = `${original.name || 'Untitled'} (copy)`
    copy.createdAt = now
    copy.updatedAt = now
    copy.exercises = copy.exercises.map((ex) => ({ ...ex, id: uid() }))
    workouts.value.push(copy)
    return copy.id
  }

  // Turn bare preset data from the server into a user-owned workout: fresh
  // ids + timestamps, and `seeded` so sync can tell it apart from user work.
  function materializePreset(preset) {
    const now = new Date().toISOString()
    return {
      ...preset,
      id: uid(),
      createdAt: now,
      updatedAt: now,
      seeded: true,
      exercises: (preset.exercises ?? []).map((ex) => ({ ...ex, id: uid() })),
    }
  }

  // Seed example workouts the very first time the app runs, so a fresh install
  // isn't an empty screen. Presets come from the server when Supabase is
  // configured (retrying next launch if offline); otherwise a built-in list.
  // Marks itself done so clearing all workouts later won't re-seed.
  async function seedIfFirstRun() {
    if (localStorage.getItem(SEEDED_KEY)) return
    if (workouts.value.length > 0) {
      localStorage.setItem(SEEDED_KEY, '1')
      return
    }
    if (isSupabaseConfigured()) {
      try {
        const presets = await fetchPresets()
        // Re-check: a sync may have populated the list while we fetched.
        if (!localStorage.getItem(SEEDED_KEY) && workouts.value.length === 0) {
          workouts.value.push(...presets.map(materializePreset))
          localStorage.setItem(SEEDED_KEY, '1')
        }
      } catch {
        // Offline / server unreachable — leave the flag unset so the next
        // launch retries.
      }
      return
    }
    const now = new Date().toISOString()
    const mk = (o) => ({ id: uid(), createdAt: now, updatedAt: now, seeded: true, ...o })
    const ex = (o) => ({ id: uid(), ...o })
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
    // Mark done only after seeding succeeded, so a crash above retries next run.
    localStorage.setItem(SEEDED_KEY, '1')
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

  return {
    workouts,
    removedIds,
    get,
    save,
    remove,
    clearRemoved,
    applySyncPlan,
    duplicate,
    seedIfFirstRun,
    importMerge,
  }
})

export function emptyExercise(type = 'reps') {
  return type === 'hiit'
    ? { id: uid(), name: '', work: 40, rest: 20 }
    : { id: uid(), name: '', sets: 3, reps: '10', rest: 60 }
}

export function emptyWorkout(type = 'reps') {
  const workout = { id: null, name: '', type, exercises: [emptyExercise(type)] }
  if (type === 'hiit') workout.rounds = 3
  return workout
}
