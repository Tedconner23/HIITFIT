import { describe, it, expect } from 'vitest'
import { buildTimeline, timelineDuration } from './hiit'

const workout = {
  rounds: 2,
  exercises: [
    { id: 'a', name: 'Burpees', work: 30, rest: 15 },
    { id: 'b', name: 'Squats', work: 20, rest: 10 },
  ],
}

describe('buildTimeline', () => {
  it('expands exercises across rounds in order', () => {
    const t = buildTimeline(workout)
    // 2 exercises × (work+rest) × 2 rounds = 8, minus the trailing rest = 7
    expect(t).toHaveLength(7)
    expect(t[0]).toMatchObject({ kind: 'work', name: 'Burpees', seconds: 30, round: 1 })
    expect(t[1]).toMatchObject({ kind: 'rest', seconds: 15, round: 1 })
    expect(t[4]).toMatchObject({ kind: 'work', name: 'Burpees', round: 2 })
  })

  it('ends on a work interval (trims trailing rest)', () => {
    expect(buildTimeline(workout).at(-1).kind).toBe('work')
  })

  it('skips zero-second rests', () => {
    const t = buildTimeline({
      rounds: 1,
      exercises: [{ id: 'a', name: 'Plank', work: 60, rest: 0 }],
    })
    expect(t).toHaveLength(1)
    expect(t[0]).toMatchObject({ kind: 'work', seconds: 60 })
  })

  it('defaults missing rounds to 1', () => {
    const t = buildTimeline({ exercises: [{ id: 'a', work: 40, rest: 20 }] })
    expect(t).toHaveLength(1) // single work, trailing rest trimmed
  })

  it('timelineDuration sums seconds', () => {
    // round: 30+15+20+10 = 75; ×2 = 150; minus trimmed final rest (10) = 140
    expect(timelineDuration(buildTimeline(workout))).toBe(140)
  })
})
