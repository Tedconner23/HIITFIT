// Expand a HIIT workout (exercises with work/rest, repeated for `rounds`) into a
// flat sequence of timed intervals for the player. Pure so it can be unit-tested.
export function buildTimeline(workout) {
  const items = []
  const rounds = Number(workout.rounds) || 1
  for (let r = 1; r <= rounds; r++) {
    for (const ex of workout.exercises) {
      const work = Number(ex.work) || 0
      if (work > 0) {
        items.push({ kind: 'work', name: ex.name || 'Exercise', seconds: work, round: r })
      }
      const rest = Number(ex.rest) || 0
      if (rest > 0) {
        items.push({ kind: 'rest', name: 'Rest', seconds: rest, round: r })
      }
    }
  }
  // End on effort, not rest.
  while (items.length && items[items.length - 1].kind === 'rest') items.pop()
  return items
}

export function timelineDuration(timeline) {
  return timeline.reduce((n, it) => n + it.seconds, 0)
}
