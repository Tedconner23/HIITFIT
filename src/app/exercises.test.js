import { describe, it, expect } from 'vitest'
import {
  EXERCISE_LIBRARY,
  EXERCISE_NAMES,
  EXERCISES,
  MUSCLES,
  EQUIPMENT,
  exerciseInfo,
  alternativesFor,
  stretchesFor,
  musclesForNames,
  equipmentForNames,
} from './exercises'

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

  it('tags every entry with known muscles and equipment', () => {
    for (const e of EXERCISES) {
      expect(e.muscles.length, e.name).toBeGreaterThan(0)
      for (const m of e.muscles) expect(MUSCLES, `${e.name}: ${m}`).toContain(m)
      for (const q of e.equipment) expect(EQUIPMENT, `${e.name}: ${q}`).toContain(q)
    }
  })

  it('has at least one stretch per muscle group', () => {
    for (const m of MUSCLES) {
      expect(stretchesFor([m]).length, m).toBeGreaterThan(0)
    }
  })
})

describe('exerciseInfo', () => {
  it('looks up entries case-insensitively', () => {
    expect(exerciseInfo('push-ups')?.name).toBe('Push-ups')
    expect(exerciseInfo('Push-ups')?.muscles[0]).toBe('chest')
    expect(exerciseInfo('Push-ups')?.category).toBe('Chest')
  })

  it('returns null for custom names', () => {
    expect(exerciseInfo('My Made-up Move')).toBeNull()
    expect(exerciseInfo('')).toBeNull()
    expect(exerciseInfo(null)).toBeNull()
  })
})

describe('alternativesFor', () => {
  it('suggests same-muscle substitutes, best overlap first', () => {
    const alts = alternativesFor('Bench Press')
    expect(alts.length).toBeGreaterThan(0)
    // every suggestion shares a muscle with bench press
    const bench = exerciseInfo('Bench Press')
    for (const a of alts) {
      expect(a.muscles.some((m) => bench.muscles.includes(m))).toBe(true)
      expect(a.name).not.toBe('Bench Press')
      expect(a.category).not.toBe('Stretching')
    }
    // the top suggestions hit the primary muscle (chest)
    expect(alts[0].muscles).toContain('chest')
  })

  it('filters by available equipment, keeping bodyweight moves', () => {
    const alts = alternativesFor('Bench Press', { equipment: [] })
    expect(alts.length).toBeGreaterThan(0)
    for (const a of alts) expect(a.equipment).toEqual([])
    expect(alts.map((a) => a.name)).toContain('Push-ups')

    const withDumbbells = alternativesFor('Bench Press', { equipment: ['dumbbells', 'bench'] })
    expect(withDumbbells.map((a) => a.name)).toContain('Dumbbell Press')
    expect(withDumbbells.map((a) => a.name)).not.toContain('Cable Crossover')
  })

  it('returns [] for unknown names and stretches', () => {
    expect(alternativesFor('Mystery Move')).toEqual([])
    expect(alternativesFor('Hamstring Stretch')).toEqual([])
  })
})

describe('stretchesFor', () => {
  it('returns stretches covering the given muscles, best coverage first', () => {
    const stretches = stretchesFor(['chest', 'shoulders'])
    expect(stretches.length).toBeGreaterThan(0)
    // best coverage first: the top result covers both muscle groups
    expect(stretches[0].muscles).toContain('chest')
    expect(stretches[0].muscles).toContain('shoulders')
    expect(stretches.map((s) => s.name)).toContain('Chest Doorway Stretch')
    for (const s of stretches) expect(s.category).toBe('Stretching')
  })

  it('returns [] when nothing matches', () => {
    expect(stretchesFor([])).toEqual([])
  })
})

describe('musclesForNames / equipmentForNames', () => {
  it('unions muscles across a workout, skipping custom names', () => {
    const muscles = musclesForNames(['Bench Press', 'Bicep Curl', 'Custom Thing'])
    expect(muscles).toContain('chest')
    expect(muscles).toContain('biceps')
    expect(muscles).not.toContain('quads')
  })

  it('lists unique equipment needed, in catalog order', () => {
    expect(equipmentForNames(['Push-ups', 'Plank'])).toEqual([])
    expect(equipmentForNames(['Bench Press', 'Dumbbell Press', 'Jump Rope'])).toEqual([
      'dumbbells',
      'barbell',
      'bench',
      'jump rope',
    ])
    expect(equipmentForNames(null)).toEqual([])
  })
})
