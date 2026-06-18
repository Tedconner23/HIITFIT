import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSessionsStore } from './sessions'

const workout = {
  id: 'w1',
  name: 'Push Day',
  exercises: [
    { id: 'e1', name: 'Bench', sets: 3, reps: '10' },
    { id: 'e2', name: 'Dips', sets: 2, reps: '12' },
  ],
}

describe('sessions store', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('persists and reads in-progress check-off state', () => {
    const s = useSessionsStore()
    s.setProgress('w1', ['e1:1', 'e1:2'])
    expect(s.getProgress('w1')).toEqual(['e1:1', 'e1:2'])
    expect(s.getProgress('unknown')).toEqual([])
  })

  it('clears progress when set to empty', () => {
    const s = useSessionsStore()
    s.setProgress('w1', ['e1:1'])
    s.setProgress('w1', [])
    expect(s.getProgress('w1')).toEqual([])
  })

  it('records a session with set totals and clears that workout progress', () => {
    const s = useSessionsStore()
    s.setProgress('w1', ['e1:1', 'e1:2', 'e2:1'])
    s.recordSession(workout, ['e1:1', 'e1:2', 'e2:1'])
    expect(s.sessions).toHaveLength(1)
    expect(s.sessions[0]).toMatchObject({
      workoutId: 'w1',
      workoutName: 'Push Day',
      setsDone: 3,
      setsTotal: 5,
    })
    expect(s.getProgress('w1')).toEqual([])
  })

  it('returns sessions for a workout newest-first', () => {
    const s = useSessionsStore()
    s.sessions.push(
      { id: 'a', workoutId: 'w1', completedAt: '2026-06-01T00:00:00Z' },
      { id: 'b', workoutId: 'w1', completedAt: '2026-06-15T00:00:00Z' },
      { id: 'c', workoutId: 'w2', completedAt: '2026-06-10T00:00:00Z' },
    )
    const list = s.sessionsFor('w1')
    expect(list.map((x) => x.id)).toEqual(['b', 'a'])
    expect(s.lastPerformed('w1')).toBe('2026-06-15T00:00:00Z')
    expect(s.lastPerformed('never')).toBeNull()
  })

  it('records a HIIT session with rounds and duration summary', () => {
    const s = useSessionsStore()
    s.recordHiitSession({
      id: 'h1',
      name: 'Tabata',
      rounds: 2,
      exercises: [{ id: 'a', name: 'Burpees', work: 20, rest: 10 }],
    })
    expect(s.sessions).toHaveLength(1)
    expect(s.sessions[0]).toMatchObject({
      workoutId: 'h1',
      type: 'hiit',
      rounds: 2,
    })
    // round = 20+10 = 30; ×2 = 60; minus trimmed final rest (10) = 50
    expect(s.sessions[0].seconds).toBe(50)
  })

  it('importSessions adds unseen ids only', () => {
    const s = useSessionsStore()
    s.sessions.push({ id: 'a', workoutId: 'w1', completedAt: '2026-06-01T00:00:00Z' })
    const n = s.importSessions([
      { id: 'a', workoutId: 'w1', completedAt: '2026-06-01T00:00:00Z' },
      { id: 'b', workoutId: 'w1', completedAt: '2026-06-02T00:00:00Z' },
    ])
    expect(n).toBe(1)
    expect(s.sessions).toHaveLength(2)
  })
})
