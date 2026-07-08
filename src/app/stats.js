// Pure date/consistency helpers derived from the session log. Dependency-free
// and side-effect-free so they can be unit-tested. All functions work off the
// session `completedAt` ISO timestamps; a caller-supplied `today` day key keeps
// them deterministic.

// Local calendar-day key for a Date, e.g. "2026-07-07".
export function dayKey(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// Day key shifted by `delta` whole days (handles month/year rollover).
export function shiftDay(key, delta) {
  const [y, m, d] = key.split('-').map(Number)
  return dayKey(new Date(y, m - 1, d + delta))
}

// Monday-based start-of-week day key for the week containing `key`.
export function weekStart(key) {
  const [y, m, d] = key.split('-').map(Number)
  const dow = (new Date(y, m - 1, d).getDay() + 6) % 7 // Mon=0 … Sun=6
  return shiftDay(key, -dow)
}

// Set of unique local day keys on which at least one session was completed.
export function activeDays(sessions) {
  const days = new Set()
  for (const s of sessions) {
    if (s?.completedAt) days.add(dayKey(new Date(s.completedAt)))
  }
  return days
}

// Per-day session counts, keyed by day key.
export function dayCounts(sessions) {
  const counts = {}
  for (const s of sessions) {
    if (!s?.completedAt) continue
    const k = dayKey(new Date(s.completedAt))
    counts[k] = (counts[k] || 0) + 1
  }
  return counts
}

// Current and longest run of consecutive active days. The current streak counts
// back from `today` — or from yesterday if today has no session yet, so it
// doesn't reset just because you haven't trained today.
export function computeStreaks(days, today) {
  const set = days instanceof Set ? days : new Set(days)

  let longest = 0
  for (const key of set) {
    if (set.has(shiftDay(key, -1))) continue // not the start of a run
    let len = 1
    let cur = key
    while (set.has(shiftDay(cur, 1))) {
      cur = shiftDay(cur, 1)
      len++
    }
    if (len > longest) longest = len
  }

  let current = 0
  let anchor = set.has(today)
    ? today
    : set.has(shiftDay(today, -1))
      ? shiftDay(today, -1)
      : null
  while (anchor && set.has(anchor)) {
    current++
    anchor = shiftDay(anchor, -1)
  }

  return { current, longest }
}

// Count of distinct active days in the current (Monday-start) week up to `today`.
export function workoutsThisWeek(days, today) {
  const set = days instanceof Set ? days : new Set(days)
  const start = weekStart(today)
  let count = 0
  for (let i = 0; i < 7; i++) {
    const k = shiftDay(start, i)
    if (k > today) break
    if (set.has(k)) count++
  }
  return count
}

// Session counts for the last `weeks` Monday-start weeks as a grid of columns
// (oldest week first), each a 7-element array Monday…Sunday of
// { key, count, future }. `today` anchors the final (current) week.
export function heatmap(sessions, today, weeks = 12) {
  const counts = dayCounts(sessions)
  const firstWeekStart = shiftDay(weekStart(today), -(weeks - 1) * 7)
  const grid = []
  for (let w = 0; w < weeks; w++) {
    const col = []
    for (let d = 0; d < 7; d++) {
      const key = shiftDay(firstWeekStart, w * 7 + d)
      col.push({ key, count: counts[key] || 0, future: key > today })
    }
    grid.push(col)
  }
  return grid
}
