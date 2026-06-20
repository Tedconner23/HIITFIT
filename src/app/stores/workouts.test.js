import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useWorkoutsStore, emptyWorkout, emptyExercise } from './workouts'

describe('workouts store', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('creates a workout with an id and timestamps', () => {
    const store = useWorkoutsStore()
    const id = store.save({ id: null, name: 'A', exercises: [] })
    const w = store.get(id)
    expect(w.name).toBe('A')
    expect(w.createdAt).toBeTruthy()
    expect(w.updatedAt).toBeTruthy()
    expect(store.workouts).toHaveLength(1)
  })

  it('updates an existing workout in place rather than duplicating', () => {
    const store = useWorkoutsStore()
    const id = store.save({ id: null, name: 'A', exercises: [] })
    store.save({ id, name: 'B', exercises: [] })
    expect(store.workouts).toHaveLength(1)
    expect(store.get(id).name).toBe('B')
  })

  it('removes a workout', () => {
    const store = useWorkoutsStore()
    const id = store.save({ id: null, name: 'A', exercises: [] })
    store.remove(id)
    expect(store.get(id)).toBeUndefined()
  })

  it('importMerge adds new workouts', () => {
    const store = useWorkoutsStore()
    const n = store.importMerge([
      { id: 'x', name: 'X', exercises: [], updatedAt: '2026-01-01T00:00:00Z' },
    ])
    expect(n).toBe(1)
    expect(store.get('x').name).toBe('X')
  })

  it('importMerge keeps the local copy when it is newer', () => {
    const store = useWorkoutsStore()
    store.workouts.push({
      id: 'x',
      name: 'local-new',
      exercises: [],
      updatedAt: '2026-06-01T00:00:00Z',
    })
    const n = store.importMerge([
      { id: 'x', name: 'backup-old', exercises: [], updatedAt: '2026-01-01T00:00:00Z' },
    ])
    expect(n).toBe(0)
    expect(store.get('x').name).toBe('local-new')
  })

  it('importMerge overwrites when the imported copy is newer', () => {
    const store = useWorkoutsStore()
    store.workouts.push({
      id: 'x',
      name: 'local-old',
      exercises: [],
      updatedAt: '2026-01-01T00:00:00Z',
    })
    const n = store.importMerge([
      { id: 'x', name: 'backup-new', exercises: [], updatedAt: '2026-06-01T00:00:00Z' },
    ])
    expect(n).toBe(1)
    expect(store.get('x').name).toBe('backup-new')
  })

  it('builds empty reps and HIIT workout shapes', () => {
    const reps = emptyWorkout()
    expect(reps.type).toBe('reps')
    expect(reps.rounds).toBeUndefined()
    expect(reps.exercises[0]).toMatchObject({ sets: 3, reps: '10' })

    const hiit = emptyWorkout('hiit')
    expect(hiit.type).toBe('hiit')
    expect(hiit.rounds).toBe(3)
    expect(hiit.exercises[0]).toMatchObject({ work: 40, rest: 20 })
    expect(emptyExercise('hiit')).toMatchObject({ work: 40, rest: 20 })
  })

  it('duplicates a workout with a new id, new exercise ids, and (copy) name', () => {
    const store = useWorkoutsStore()
    const id = store.save({
      id: null,
      name: 'Push Day',
      type: 'reps',
      exercises: [{ id: 'e1', name: 'Bench', sets: 3, reps: '10', rest: 60 }],
    })
    const copyId = store.duplicate(id)
    expect(store.workouts).toHaveLength(2)
    const copy = store.get(copyId)
    expect(copy.id).not.toBe(id)
    expect(copy.name).toBe('Push Day (copy)')
    expect(copy.exercises[0].id).not.toBe('e1')
    expect(copy.exercises[0].name).toBe('Bench')
  })

  it('seeds example workouts only on the first run', () => {
    const store = useWorkoutsStore()
    store.seedIfFirstRun()
    const seeded = store.workouts.length
    expect(seeded).toBeGreaterThan(2)
    expect(store.workouts.some((w) => w.type === 'hiit')).toBe(true)
    expect(store.workouts.some((w) => w.type === 'reps')).toBe(true)
    expect(localStorage.getItem('seeded')).toBe('1')
    // second call is a no-op
    store.seedIfFirstRun()
    expect(store.workouts.length).toBe(seeded)
  })

  it('importMerge rejects non-arrays and skips malformed entries', () => {
    const store = useWorkoutsStore()
    expect(() => store.importMerge({})).toThrow()
    const n = store.importMerge([
      { name: 'no id' },
      { id: 'y', exercises: 'not an array' },
    ])
    expect(n).toBe(0)
    expect(store.workouts).toHaveLength(0)
  })
})
