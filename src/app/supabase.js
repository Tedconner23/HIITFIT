import { createClient } from '@supabase/supabase-js'

// Cloud backend (Phase B). Entirely optional: without env config the app runs
// exactly as before — local-only, no login. Set these in `.env`:
//   VITE_SUPABASE_URL=https://<project>.supabase.co
//   VITE_SUPABASE_ANON_KEY=<anon key>
const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

let client = null

export function isSupabaseConfigured() {
  return Boolean(url && key)
}

export function getSupabase() {
  if (!client && isSupabaseConfigured()) client = createClient(url, key)
  return client
}

// Preset workouts are rows with user_id NULL — readable without signing in.
// Returns bare workout data (no ids/timestamps); the caller materializes them.
export async function fetchPresets() {
  const c = getSupabase()
  if (!c) return []
  const { data, error } = await c
    .from('workouts')
    .select('data')
    .is('user_id', null)
    .order('name')
  if (error) throw error
  return data.map((row) => row.data)
}
