import { describe, it, expect } from 'vitest'
import { EXERCISE_LIBRARY, EXERCISE_NAMES } from './exercises'

describe('exercise library', () => {
  it('exposes a flat, de-duplicated, sorted name list', () => {
    const flat = Object.values(EXERCISE_LIBRARY).flat()
    // de-duplicated
    expect(EXERCISE_NAMES.length).toBe(new Set(flat).size)
    expect(EXERCISE_NAMES.length).toBe(new Set(EXERCISE_NAMES).size)
    // sorted
    const sorted = [...EXERCISE_NAMES].sort((a, b) => a.localeCompare(b))
    expect(EXERCISE_NAMES).toEqual(sorted)
    // substantial catalog
    expect(EXERCISE_NAMES.length).toBeGreaterThan(50)
  })
})
