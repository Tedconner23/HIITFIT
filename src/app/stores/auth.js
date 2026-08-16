import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getSupabase } from '../supabase'

// Supabase email+password auth. `user` is null when signed out or when
// Supabase isn't configured (the app then stays local-only).
export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const ready = ref(false)

  async function init() {
    const client = getSupabase()
    if (!client) {
      ready.value = true
      return
    }
    const { data } = await client.auth.getSession()
    user.value = data.session?.user ?? null
    client.auth.onAuthStateChange((_event, session) => {
      user.value = session?.user ?? null
    })
    ready.value = true
  }

  async function signIn(email, password) {
    const { error } = await getSupabase().auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  // Returns true if signed in immediately; false means Supabase sent a
  // confirmation email first (its default) and the user must confirm then sign in.
  async function signUp(email, password) {
    const { data, error } = await getSupabase().auth.signUp({ email, password })
    if (error) throw error
    return Boolean(data.session)
  }

  async function signOut() {
    await getSupabase().auth.signOut()
  }

  return { user, ready, init, signIn, signUp, signOut }
})
