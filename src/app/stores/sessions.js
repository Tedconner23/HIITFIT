import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { buildTimeline, timelineDuration } from '../hiit'

// Completed workout sessions (history) + in-progress check-off state so a
// perform session can be resumed after leaving the screen. Local-first, same
// as the workouts store.
const SESSIONS_KEY = 'sessions'
const PROGRESS_KEY = 'progress'

function loadJSON(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback
  } catch {
    return fallback
  }
}

export const useSessionsStore = defineStore('sessions', () => {
  const sessions = ref(loadJSON(SESSIONS_KEY, []))
  // { [workoutId]: string[] } — checked-set keys for an unfinished session.
  const progress = ref(loadJSON(PROGRESS_KEY, {}))

  watch(sessions, (v) => localStorage.setItem(SESSIONS_KEY, JSON.stringify(v)), {
    deep: true,
  })
  watch(progress, (v) => localStorage.setItem(PROGRESS_KEY, JSON.stringify(v)), {
    deep: true,
  })

  function getProgress(workoutId) {
    return progress.value[workoutId] ?? []
  }

  function setProgress(workoutId, keys) {
    if (keys.length) progress.value[workoutId] = keys
    else delete progress.value[workoutId]
  }

  function clearProgress(workoutId) {
    delete progress.value[workoutId]
  }

  // Record a completed session from the workout template + checked-set keys,
  // then clear that workout's in-progress state. `seconds` (how long the perform
  // took) is optional — older sessions don't have it and must still render.
  function recordSession(workout, doneKeys, seconds) {
    const setsTotal = workout.exercises.reduce(
      (n, ex) => n + (Number(ex.sets) || 0),
      0,
    )
    sessions.value.push({
      id: crypto.randomUUID(),
      workoutId: workout.id,
      workoutName: workout.name || 'Untitled',
      completedAt: new Date().toISOString(),
      setsDone: doneKeys.length,
      setsTotal,
      ...(Number(seconds) > 0 ? { seconds: Math.round(seconds) } : {}),
    })
    clearProgress(workout.id)
  }

  // HIIT sessions complete in full (the timer runs the whole thing), so record
  // on finish with a rounds + duration summary.
  function recordHiitSession(workout) {
    sessions.value.push({
      id: crypto.randomUUID(),
      workoutId: workout.id,
      workoutName: workout.name || 'Untitled',
      type: 'hiit',
      completedAt: new Date().toISOString(),
      rounds: Number(workout.rounds) || 1,
      seconds: timelineDuration(buildTimeline(workout)),
    })
    clearProgress(workout.id)
  }

  function sessionsFor(workoutId) {
    return sessions.value
      .filter((s) => s.workoutId === workoutId)
      .sort((a, b) => b.completedAt.localeCompare(a.completedAt))
  }

  function lastPerformed(workoutId) {
    const list = sessionsFor(workoutId)
    return list.length ? list[0].completedAt : null
  }

  // Add sessions from a backup, skipping ids we already have. Returns count added.
  function importSessions(list) {
    if (!Array.isArray(list)) throw new Error('Invalid backup file')
    let changed = 0
    const seen = new Set(sessions.value.map((s) => s.id))
    for (const s of list) {
      if (!s?.id || seen.has(s.id)) continue
      sessions.value.push(s)
      seen.add(s.id)
      changed++
    }
    return changed
  }

  return {
    sessions,
    progress,
    getProgress,
    setProgress,
    clearProgress,
    recordSession,
    recordHiitSession,
    sessionsFor,
    lastPerformed,
    importSessions,
  }
})
