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
