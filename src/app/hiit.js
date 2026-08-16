// Expand a HIIT workout (exercises with work/rest, repeated for `rounds`) into a
// flat sequence of timed intervals for the player. Pure so it can be unit-tested.
//
// Optional workout-level fields extend the basic work/rest loop:
//   warmup            — lead-in effort before round 1 (seconds)
//   cooldown          — wind-down after the last round (seconds)
//   restBetweenRounds — rest inserted between rounds (replaces the trailing
//                       exercise rest of that round so rounds don't double-rest)
export function buildTimeline(workout) {
  const items = []
  const rounds = Number(workout.rounds) || 1
  const warmup = Number(workout.warmup) || 0
  const cooldown = Number(workout.cooldown) || 0
  const roundRest = Number(workout.restBetweenRounds) || 0

  if (warmup > 0) {
    items.push({ kind: 'warmup', name: 'Warm-up', seconds: warmup, round: 0 })
  }

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
    // Rest between rounds (not after the last round). Drop the round's trailing
    // exercise rest first so the transition isn't rest-on-rest.
    if (roundRest > 0 && r < rounds) {
      while (items.length && items[items.length - 1].kind === 'rest') items.pop()
      items.push({ kind: 'rest', name: 'Round rest', seconds: roundRest, round: r })
    }
  }

  // End the effort on work, not rest — trim any trailing rest before cool-down.
  while (items.length && items[items.length - 1].kind === 'rest') items.pop()

  if (cooldown > 0) {
    items.push({ kind: 'cooldown', name: 'Cool-down', seconds: cooldown, round: rounds })
  }
  return items
}

export function timelineDuration(timeline) {
  return timeline.reduce((n, it) => n + it.seconds, 0)
}

// Human label for an interval kind, shown in the player.
export function phaseLabel(kind) {
  switch (kind) {
    case 'work':
      return 'Work'
    case 'rest':
      return 'Rest'
    case 'warmup':
      return 'Warm-up'
    case 'cooldown':
      return 'Cool-down'
    default:
      return 'Get ready'
  }
}
