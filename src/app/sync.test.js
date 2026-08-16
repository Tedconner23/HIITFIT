import { describe, it, expect } from 'vitest'
import { planSync } from './sync'

const w = (id, updatedAt, extra = {}) => ({
  id,
  name: id,
  updatedAt,
  createdAt: extra.createdAt ?? '2026-01-01T00:00:00Z',
  exercises: [],
  ...extra,
})
const row = (workout) => ({ id: workout.id, data: workout })

describe('planSync', () => {
  it('pulls server workouts missing locally', () => {
    const server = w('a', '2026-01-02T00:00:00Z')
    const plan = planSync([], [row(server)], [])
    expect(plan.addLocal).toEqual([server])
    expect(plan.push).toEqual([])
  })

  it('pulls the server copy when it is newer', () => {
    const mine = w('a', '2026-01-01T00:00:00Z')
    const server = w('a', '2026-01-03T00:00:00Z')
    const plan = planSync([mine], [row(server)], [])
    expect(plan.updateLocal).toEqual([server])
    expect(plan.push).toEqual([])
  })

  it('pushes the local copy when it is newer', () => {
    const mine = w('a', '2026-01-03T00:00:00Z')
    const server = w('a', '2026-01-01T00:00:00Z')
    const plan = planSync([mine], [row(server)], [])
    expect(plan.push).toEqual([mine])
    expect(plan.updateLocal).toEqual([])
  })

  it('does nothing when both sides match', () => {
    const mine = w('a', '2026-01-01T00:00:00Z')
    const plan = planSync([mine], [row(mine)], [])
    expect(plan.addLocal).toEqual([])
    expect(plan.updateLocal).toEqual([])
    expect(plan.push).toEqual([])
  })

  it('pushes local workouts the server has never seen', () => {
    const mine = w('a', '2026-01-01T00:00:00Z')
    const plan = planSync([mine], [], [])
    expect(plan.push).toEqual([mine])
  })

  it('deletes tombstoned ids remotely instead of re-pulling them', () => {
    const server = w('a', '2026-01-02T00:00:00Z')
    const plan = planSync([], [row(server)], ['a'])
    expect(plan.addLocal).toEqual([])
    expect(plan.deleteRemote).toEqual(['a'])
  })

  it('drops unmodified seeded copies when the account already has cloud data', () => {
    const seeded = w('local-seed', '2026-01-01T00:00:00Z', {
      seeded: true,
      createdAt: '2026-01-01T00:00:00Z',
    })
    const cloud = w('cloud-1', '2026-01-02T00:00:00Z')
    const plan = planSync([seeded], [row(cloud)], [])
    expect(plan.dropLocal).toEqual(['local-seed'])
    expect(plan.push).toEqual([])
    expect(plan.addLocal).toEqual([cloud])
  })

  it('pushes seeded copies on a brand-new account (empty server)', () => {
    const seeded = w('local-seed', '2026-01-01T00:00:00Z', {
      seeded: true,
      createdAt: '2026-01-01T00:00:00Z',
    })
    const plan = planSync([seeded], [], [])
    expect(plan.push).toEqual([seeded])
    expect(plan.dropLocal).toEqual([])
  })

  it('keeps and pushes seeded copies the user has since edited', () => {
    const edited = w('local-seed', '2026-01-05T00:00:00Z', {
      seeded: true,
      createdAt: '2026-01-01T00:00:00Z',
    })
    const cloud = w('cloud-1', '2026-01-02T00:00:00Z')
    const plan = planSync([edited], [row(cloud)], [])
    expect(plan.push).toEqual([edited])
    expect(plan.dropLocal).toEqual([])
  })
})
