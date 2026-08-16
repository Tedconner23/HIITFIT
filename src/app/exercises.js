// Built-in catalog of common exercises. Powers the type-ahead suggestions in
// the workout editor plus the tag-driven features: equipment lists for HIIT
// setup, alternative-exercise search, and muscle-matched stretch suggestions.
// Custom names are still allowed — these are only suggestions.
//
// Each entry: { name, category, muscles, equipment }
//   muscles   — muscle groups hit, primary first (see MUSCLES)
//   equipment — what's needed to perform it; [] means bodyweight-only

export const MUSCLES = [
  'chest',
  'back',
  'shoulders',
  'biceps',
  'triceps',
  'forearms',
  'quads',
  'hamstrings',
  'glutes',
  'calves',
  'core',
  'hips',
]

export const EQUIPMENT = [
  'dumbbells',
  'barbell',
  'kettlebell',
  'bench',
  'pull-up bar',
  'dip bars',
  'bar',
  'cable machine',
  'machine',
  'box',
  'jump rope',
  'battle ropes',
  'sled',
  'medicine ball',
  'ab wheel',
  'rower',
  'bike',
]

const x = (name, muscles, equipment = []) => ({ name, muscles, equipment })

const CATALOG = {
  Chest: [
    x('Push-ups', ['chest', 'triceps', 'core']),
    x('Incline Push-ups', ['chest', 'triceps']),
    x('Diamond Push-ups', ['triceps', 'chest']),
    x('Wide Push-ups', ['chest', 'shoulders']),
    x('Bench Press', ['chest', 'triceps', 'shoulders'], ['barbell', 'bench']),
    x('Incline Bench Press', ['chest', 'shoulders', 'triceps'], ['barbell', 'bench']),
    x('Dumbbell Press', ['chest', 'triceps', 'shoulders'], ['dumbbells', 'bench']),
    x('Chest Fly', ['chest'], ['dumbbells', 'bench']),
    x('Cable Crossover', ['chest'], ['cable machine']),
    x('Dips', ['chest', 'triceps', 'shoulders'], ['dip bars']),
  ],
  Back: [
    x('Pull-ups', ['back', 'biceps'], ['pull-up bar']),
    x('Chin-ups', ['back', 'biceps'], ['pull-up bar']),
    x('Inverted Rows', ['back', 'biceps', 'core'], ['bar']),
    x('Bent-over Row', ['back', 'biceps'], ['barbell']),
    x('Dumbbell Row', ['back', 'biceps'], ['dumbbells', 'bench']),
    x('Lat Pulldown', ['back', 'biceps'], ['cable machine']),
    x('Seated Cable Row', ['back', 'biceps'], ['cable machine']),
    x('Deadlift', ['back', 'hamstrings', 'glutes'], ['barbell']),
    x('Superman', ['back', 'glutes']),
    x('Face Pull', ['shoulders', 'back'], ['cable machine']),
  ],
  Shoulders: [
    x('Overhead Press', ['shoulders', 'triceps'], ['barbell']),
    x('Arnold Press', ['shoulders', 'triceps'], ['dumbbells']),
    x('Lateral Raise', ['shoulders'], ['dumbbells']),
    x('Front Raise', ['shoulders'], ['dumbbells']),
    x('Rear Delt Fly', ['shoulders', 'back'], ['dumbbells']),
    x('Pike Push-ups', ['shoulders', 'triceps']),
    x('Shrugs', ['back', 'forearms'], ['dumbbells']),
    x('Upright Row', ['shoulders', 'back'], ['barbell']),
  ],
  Arms: [
    x('Bicep Curl', ['biceps'], ['dumbbells']),
    x('Hammer Curl', ['biceps', 'forearms'], ['dumbbells']),
    x('Concentration Curl', ['biceps'], ['dumbbells']),
    x('Tricep Extension', ['triceps'], ['dumbbells']),
    x('Tricep Dips', ['triceps', 'chest'], ['bench']),
    x('Skull Crushers', ['triceps'], ['barbell', 'bench']),
    x('Close-grip Push-ups', ['triceps', 'chest']),
  ],
  Legs: [
    x('Squats', ['quads', 'glutes', 'core']),
    x('Goblet Squat', ['quads', 'glutes'], ['dumbbells']),
    x('Front Squat', ['quads', 'glutes', 'core'], ['barbell']),
    x('Lunges', ['quads', 'glutes']),
    x('Reverse Lunges', ['quads', 'glutes']),
    x('Walking Lunges', ['quads', 'glutes']),
    x('Bulgarian Split Squat', ['quads', 'glutes'], ['bench']),
    x('Step-ups', ['quads', 'glutes'], ['box']),
    x('Romanian Deadlift', ['hamstrings', 'glutes', 'back'], ['barbell']),
    x('Leg Press', ['quads', 'glutes'], ['machine']),
    x('Leg Curl', ['hamstrings'], ['machine']),
    x('Leg Extension', ['quads'], ['machine']),
    x('Calf Raises', ['calves']),
    x('Glute Bridge', ['glutes', 'hamstrings']),
    x('Hip Thrust', ['glutes', 'hamstrings'], ['barbell', 'bench']),
    x('Wall Sit', ['quads', 'glutes']),
  ],
  Core: [
    x('Plank', ['core']),
    x('Side Plank', ['core']),
    x('Crunches', ['core']),
    x('Bicycle Crunches', ['core']),
    x('Sit-ups', ['core']),
    x('Leg Raises', ['core', 'hips']),
    x('Russian Twists', ['core']),
    x('Mountain Climbers', ['core', 'shoulders']),
    x('Flutter Kicks', ['core', 'hips']),
    x('Dead Bug', ['core']),
    x('Hollow Hold', ['core']),
    x('V-ups', ['core']),
    x('Hanging Knee Raises', ['core', 'hips'], ['pull-up bar']),
    x('Ab Wheel Rollout', ['core', 'shoulders'], ['ab wheel']),
  ],
  Cardio: [
    x('Burpees', ['quads', 'chest', 'core']),
    x('Jumping Jacks', ['calves', 'shoulders']),
    x('High Knees', ['quads', 'calves', 'core']),
    x('Butt Kicks', ['hamstrings', 'calves']),
    x('Jump Rope', ['calves', 'forearms'], ['jump rope']),
    x('Sprints', ['quads', 'hamstrings', 'glutes', 'calves']),
    x('Box Jumps', ['quads', 'glutes', 'calves'], ['box']),
    x('Jump Squats', ['quads', 'glutes', 'calves']),
    x('Skaters', ['glutes', 'quads', 'calves']),
    x('Tuck Jumps', ['quads', 'core', 'calves']),
    x('Bear Crawl', ['core', 'shoulders', 'quads']),
    x('Battle Ropes', ['shoulders', 'core', 'forearms'], ['battle ropes']),
    x('Rowing', ['back', 'quads', 'core'], ['rower']),
    x('Cycling', ['quads', 'calves'], ['bike']),
    x('Running', ['quads', 'hamstrings', 'calves']),
  ],
  'Full Body': [
    x('Thrusters', ['quads', 'glutes', 'shoulders'], ['barbell']),
    x('Clean and Press', ['back', 'quads', 'glutes', 'shoulders'], ['barbell']),
    x('Kettlebell Swing', ['glutes', 'hamstrings', 'back', 'core'], ['kettlebell']),
    x('Turkish Get-up', ['core', 'shoulders', 'glutes'], ['kettlebell']),
    x('Man Makers', ['chest', 'back', 'shoulders', 'quads', 'core'], ['dumbbells']),
    x('Devil Press', ['chest', 'shoulders', 'quads', 'core'], ['dumbbells']),
    x('Wall Balls', ['quads', 'glutes', 'shoulders'], ['medicine ball']),
    x('Sled Push', ['quads', 'glutes', 'calves', 'core'], ['sled']),
  ],
  Stretching: [
    x('Hamstring Stretch', ['hamstrings']),
    x('Quad Stretch', ['quads']),
    x('Hip Flexor Stretch', ['hips', 'quads']),
    x('Child’s Pose', ['back', 'hips']),
    x('Cat-Cow', ['back', 'core']),
    x('Downward Dog', ['hamstrings', 'calves', 'shoulders', 'back']),
    x('Cobra Stretch', ['core', 'hips']),
    x('Shoulder Stretch', ['shoulders']),
    x('Chest Doorway Stretch', ['chest', 'shoulders']),
    x('Triceps Stretch', ['triceps', 'shoulders']),
    x('Wrist Flexor Stretch', ['forearms', 'biceps']),
    x('Calf Stretch', ['calves']),
    x('Figure-4 Glute Stretch', ['glutes', 'hips']),
    x('Butterfly Stretch', ['hips']),
    x('Arm Circles', ['shoulders', 'chest']),
    x('Leg Swings', ['hips', 'hamstrings', 'quads']),
    x('World’s Greatest Stretch', ['hips', 'hamstrings', 'back']),
  ],
}

// Flat entry list with `category` stamped on, and a case-insensitive index.
export const EXERCISES = Object.entries(CATALOG).flatMap(([category, entries]) =>
  entries.map((e) => ({ ...e, category })),
)

const BY_NAME = new Map(EXERCISES.map((e) => [e.name.toLowerCase(), e]))

// Legacy shape: category → names. Kept for the editor's grouped suggestions.
export const EXERCISE_LIBRARY = Object.fromEntries(
  Object.entries(CATALOG).map(([category, entries]) => [category, entries.map((e) => e.name)]),
)

// Flat, de-duplicated list of all exercise names for the <datalist>.
export const EXERCISE_NAMES = [...new Set(EXERCISES.map((e) => e.name))].sort((a, b) =>
  a.localeCompare(b),
)

// Catalog entry for a name (case-insensitive), or null for custom exercises.
export function exerciseInfo(name) {
  return BY_NAME.get(String(name ?? '').toLowerCase()) ?? null
}

// Substitutes for an exercise: non-stretch entries sharing muscle groups,
// ranked by how well they cover the original's muscles (primary counts extra).
// Pass `equipment` (array of available EQUIPMENT strings) to keep only moves
// doable with what's on hand — bodyweight moves always qualify.
export function alternativesFor(name, { equipment = null } = {}) {
  const target = exerciseInfo(name)
  if (!target || target.category === 'Stretching') return []
  const primary = target.muscles[0]
  const available = equipment && new Set(equipment)
  return EXERCISES.filter(
    (e) =>
      e.name !== target.name &&
      e.category !== 'Stretching' &&
      e.muscles.some((m) => target.muscles.includes(m)) &&
      (!available || e.equipment.every((q) => available.has(q))),
  )
    .map((e) => ({
      ...e,
      score: e.muscles.filter((m) => target.muscles.includes(m)).length + (e.muscles.includes(primary) ? 1 : 0),
    }))
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
}

// Stretch/warm-up entries covering any of the given muscle groups, best
// coverage first. Feeds "appropriate stretches" for a workout's muscles.
export function stretchesFor(muscles) {
  const wanted = new Set(muscles)
  return EXERCISES.filter(
    (e) => e.category === 'Stretching' && e.muscles.some((m) => wanted.has(m)),
  )
    .map((e) => ({ ...e, score: e.muscles.filter((m) => wanted.has(m)).length }))
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
}

// Union of muscle groups a workout's exercises hit (unknown names skipped).
export function musclesForNames(names) {
  const out = new Set()
  for (const n of names ?? []) for (const m of exerciseInfo(n)?.muscles ?? []) out.add(m)
  return [...out]
}

// Unique equipment needed for a list of exercise names, in catalog order.
// Unknown (custom) names are skipped; [] means bodyweight-only.
export function equipmentForNames(names) {
  const needed = new Set()
  for (const n of names ?? []) for (const q of exerciseInfo(n)?.equipment ?? []) needed.add(q)
  return EQUIPMENT.filter((q) => needed.has(q))
}
