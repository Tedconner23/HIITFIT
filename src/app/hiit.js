// Expand a HIIT workout (exercises with work/rest, repeated for `rounds`) into a
// flat sequence of timed intervals for the player. Pure so it can be unit-tested.
//
// Optional workout-level fields (all backward-compatible — absent/0 = skipped):
//   warmup            seconds of a lead-in "Warm-up" interval at the very start
//   cooldown          seconds of a closing "Cool-down" interval at the very end
//   restBetweenRounds seconds of rest inserted between rounds (not after the last)
export function buildTimeline(workout) {
  const items = []
  const rounds = Number(workout.rounds) || 1
  const restBetween = Number(workout.restBetweenRounds) || 0
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
    // Rest between rounds — after each round except the last.
    if (restBetween > 0 && r < rounds) {
      items.push({ kind: 'rest', name: 'Round rest', seconds: restBetween, round: r })
    }
  }
  // End on effort, not rest — trim trailing rests from the core sequence.
  while (items.length && items[items.length - 1].kind === 'rest') items.pop()
  // Warm-up leads in and cool-down closes out; both wrap the trimmed core so the
  // cool-down is deliberately kept at the very end.
  const warmup = Number(workout.warmup) || 0
  if (warmup > 0) {
    items.unshift({ kind: 'warmup', name: 'Warm-up', seconds: warmup, round: 0 })
  }
  const cooldown = Number(workout.cooldown) || 0
  if (cooldown > 0) {
    items.push({ kind: 'cooldown', name: 'Cool-down', seconds: cooldown, round: 0 })
  }
  return items
}

export function timelineDuration(timeline) {
  return timeline.reduce((n, it) => n + it.seconds, 0)
}
