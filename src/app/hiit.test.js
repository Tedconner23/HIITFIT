import { describe, it, expect } from 'vitest'
import { buildTimeline, timelineDuration, phaseLabel } from './hiit'

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

  it('prepends a warm-up interval', () => {
    const t = buildTimeline({ ...workout, warmup: 30 })
    expect(t[0]).toMatchObject({ kind: 'warmup', name: 'Warm-up', seconds: 30, round: 0 })
    expect(t[1].kind).toBe('work')
  })

  it('appends a cool-down as the final interval (after trailing-rest trim)', () => {
    const t = buildTimeline({ ...workout, cooldown: 45 })
    expect(t.at(-1)).toMatchObject({ kind: 'cooldown', name: 'Cool-down', seconds: 45 })
    // still ends on effort → cool-down, and the trailing exercise rest is gone
    expect(t.filter((i) => i.kind === 'cooldown')).toHaveLength(1)
  })

  it('inserts rest between rounds, replacing that round trailing exercise rest', () => {
    const t = buildTimeline({ ...workout, restBetweenRounds: 60 })
    const roundRests = t.filter((i) => i.name === 'Round rest')
    // one round boundary for 2 rounds
    expect(roundRests).toHaveLength(1)
    expect(roundRests[0]).toMatchObject({ kind: 'rest', seconds: 60 })
    // no rest-on-rest: the interval before a round rest is work
    const idx = t.findIndex((i) => i.name === 'Round rest')
    expect(t[idx - 1].kind).toBe('work')
  })

  it('does not add a round rest after the final round', () => {
    const t = buildTimeline({
      rounds: 1,
      restBetweenRounds: 60,
      exercises: [{ id: 'a', name: 'X', work: 20, rest: 10 }],
    })
    expect(t.some((i) => i.name === 'Round rest')).toBe(false)
  })
})

describe('phaseLabel', () => {
  it('maps interval kinds to labels', () => {
    expect(phaseLabel('work')).toBe('Work')
    expect(phaseLabel('rest')).toBe('Rest')
    expect(phaseLabel('warmup')).toBe('Warm-up')
    expect(phaseLabel('cooldown')).toBe('Cool-down')
    expect(phaseLabel('prep')).toBe('Get ready')
  })
})
