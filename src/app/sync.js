import { ref, watch } from 'vue'
import { getSupabase } from './supabase'
import { useAuthStore } from './stores/auth'
import { useWorkoutsStore } from './stores/workouts'

// Two-way workout sync, last-write-wins by the `updatedAt` inside each
// workout object (per knowledge/tech-stack.md). The whole dataset is tiny
// (tens of rows), so every sync is a full pull + diff + push — simple and
// robust, no per-row bookkeeping beyond delete tombstones.

// Decide what to change, given local state and the user's server rows.
// Pure so it can be unit-tested. `serverRows` are {id, data} where data is the
// full workout object; `removedIds` are tombstones of local deletes.
export function planSync(local, serverRows, removedIds = []) {
  const removed = new Set(removedIds)
  const rows = serverRows.filter((r) => !removed.has(r.id))
  const serverById = new Map(rows.map((r) => [r.id, r]))
  const localById = new Map(local.map((w) => [w.id, w]))

  const addLocal = []
  const updateLocal = []
  const dropLocal = []
  const push = []

  for (const r of rows) {
    const server = r.data
    const mine = localById.get(r.id)
    if (!mine) addLocal.push(server)
    else if (new Date(server.updatedAt) > new Date(mine.updatedAt)) updateLocal.push(server)
    else if (new Date(mine.updatedAt) > new Date(server.updatedAt)) push.push(mine)
  }

  for (const mine of local) {
    if (serverById.has(mine.id)) continue
    // A fresh device seeds its own preset copies before first sign-in. If the
    // account already has cloud data, pushing those would duplicate the list —
    // drop unmodified seeded copies instead.
    if (serverRows.length > 0 && mine.seeded && mine.updatedAt === mine.createdAt) {
      dropLocal.push(mine.id)
      continue
    }
    push.push(mine)
  }

  return { addLocal, updateLocal, dropLocal, push, deleteRemote: [...removed] }
}

export const syncStatus = ref({ state: 'idle', at: null, error: null })

let syncing = false

export async function syncNow() {
  const client = getSupabase()
  const auth = useAuthStore()
  if (!client || !auth.user || syncing) return
  syncing = true
  syncStatus.value = { ...syncStatus.value, state: 'syncing', error: null }
  try {
    const store = useWorkoutsStore()
    const { data: rows, error } = await client
      .from('workouts')
      .select('id, data')
      .eq('user_id', auth.user.id)
    if (error) throw error

    const plan = planSync(store.workouts, rows, store.removedIds)
    store.applySyncPlan(plan)

    if (plan.deleteRemote.length) {
      const { error: delErr } = await client
        .from('workouts')
        .delete()
        .in('id', plan.deleteRemote)
        .eq('user_id', auth.user.id)
      if (delErr) throw delErr
      store.clearRemoved(plan.deleteRemote)
    }

    if (plan.push.length) {
      const { error: pushErr } = await client.from('workouts').upsert(
        plan.push.map((w) => ({
          id: w.id,
          user_id: auth.user.id,
          name: w.name || 'Untitled',
          data: JSON.parse(JSON.stringify(w)),
          updated_at: w.updatedAt,
        })),
      )
      if (pushErr) throw pushErr
    }

    syncStatus.value = { state: 'ok', at: new Date().toISOString(), error: null }
  } catch (e) {
    syncStatus.value = { ...syncStatus.value, state: 'error', error: e.message ?? String(e) }
  } finally {
    syncing = false
  }
}

// Wire automatic syncing: on sign-in, on any local change (debounced), and
// when the network comes back. Call once from the app entry.
export function installAutoSync() {
  const auth = useAuthStore()
  const store = useWorkoutsStore()

  watch(
    () => auth.user?.id,
    (id) => {
      if (id) syncNow()
    },
  )

  let timer = null
  watch(
    () => store.workouts,
    () => {
      if (!auth.user) return
      clearTimeout(timer)
      timer = setTimeout(syncNow, 1500)
    },
    { deep: true },
  )

  window.addEventListener('online', syncNow)
}
