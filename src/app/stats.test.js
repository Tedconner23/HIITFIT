import { describe, it, expect } from 'vitest'
import {
  dayKey,
  shiftDay,
  weekStart,
  activeDays,
  computeStreaks,
  workoutsThisWeek,
  heatmap,
} from './stats'

// Sessions on given local day keys (noon avoids any DST edge surprises).
const sess = (...keys) => keys.map((k, i) => ({ id: String(i), completedAt: `${k}T12:00:00` }))

describe('date helpers', () => {
  it('shiftDay rolls across month boundaries', () => {
    expect(shiftDay('2026-07-01', -1)).toBe('2026-06-30')
    expect(shiftDay('2026-12-31', 1)).toBe('2027-01-01')
  })

  it('weekStart returns the Monday of the week', () => {
    // 2026-07-07 is a Tuesday → Monday is 2026-07-06
    expect(weekStart('2026-07-07')).toBe('2026-07-06')
    expect(weekStart('2026-07-06')).toBe('2026-07-06')
    // Sunday belongs to the week that started the preceding Monday
    expect(weekStart('2026-07-12')).toBe('2026-07-06')
  })

  it('activeDays de-duplicates same-day sessions', () => {
    const days = activeDays(sess('2026-07-07', '2026-07-07', '2026-07-06'))
    expect(days.size).toBe(2)
    expect(days.has('2026-07-07')).toBe(true)
  })
})

describe('computeStreaks', () => {
  it('counts the current streak ending today', () => {
    const days = activeDays(sess('2026-07-05', '2026-07-06', '2026-07-07'))
    expect(computeStreaks(days, '2026-07-07')).toEqual({ current: 3, longest: 3 })
  })

  it('still counts the streak when today has no session yet', () => {
    const days = activeDays(sess('2026-07-05', '2026-07-06'))
    // today = 07-07 (no session), but yesterday chain of 2 is still "current"
    expect(computeStreaks(days, '2026-07-07')).toMatchObject({ current: 2 })
  })

  it('resets the current streak after a two-day gap', () => {
    const days = activeDays(sess('2026-07-01', '2026-07-02'))
    expect(computeStreaks(days, '2026-07-07')).toMatchObject({ current: 0 })
  })

  it('tracks the longest streak independent of the current one', () => {
    const days = activeDays(
      sess('2026-06-01', '2026-06-02', '2026-06-03', '2026-06-04', '2026-07-07'),
    )
    expect(computeStreaks(days, '2026-07-07')).toEqual({ current: 1, longest: 4 })
  })

  it('is zero with no sessions', () => {
    expect(computeStreaks(new Set(), '2026-07-07')).toEqual({ current: 0, longest: 0 })
  })
})

describe('workoutsThisWeek', () => {
  it('counts distinct active days in the current Monday-start week', () => {
    const days = activeDays(
      sess('2026-07-06', '2026-07-07', '2026-07-07', '2026-06-30'),
    )
    // week of 07-06: Mon 07-06 + Tue 07-07 (deduped) = 2; 06-30 is last week
    expect(workoutsThisWeek(days, '2026-07-07')).toBe(2)
  })
})

describe('heatmap', () => {
  it('returns a weeks-by-7 grid ending in the current week', () => {
    const grid = heatmap(sess('2026-07-07'), '2026-07-07', 12)
    expect(grid).toHaveLength(12)
    expect(grid.every((col) => col.length === 7)).toBe(true)
    const last = grid.at(-1)
    expect(last[0].key).toBe('2026-07-06') // Monday of the current week
    // Tuesday of the current week carries the one session
    expect(last[1]).toMatchObject({ key: '2026-07-07', count: 1 })
    // days after today are flagged as future
    expect(last.at(-1).future).toBe(true)
  })
})
