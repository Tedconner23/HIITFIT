import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useWorkoutsStore } from './workouts'

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
