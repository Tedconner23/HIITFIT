# HIITFIT

A workout PWA for planning, building, and performing workouts on your phone —
with both **rep-based** strength workouts and **timed HIIT** circuits.
Local-first: works offline, no account required.

**Goal:** an app-store fitness app (the PWA is the testing vehicle) with custom
workouts, check-off rep training, and fully automated HIIT/Tabata — the app cues
every work/rest/exercise switch so time-based training needs no interaction.
See [`knowledge/roadmap.md`](knowledge/roadmap.md) for the market gap assessment
and prioritized next steps.

## Features

- **Rep workouts** — build reusable templates (exercises with sets/reps), then
  perform them by checking off sets. Progress resumes if you leave mid-session.
- **HIIT workouts** — exercises with work/rest seconds repeated for N rounds.
  The player auto-counts down each interval with a 3-2-1 lead-in, beeps on
  transitions, keeps the screen awake, and logs the session when finished.
- **History** — every completed session is recorded per workout (sets done, or
  rounds + duration for HIIT).
- **Backup / Restore** — export all workouts + history to a JSON file and import
  it back (useful since data lives only in the browser).
- **Installable PWA** — add to your home screen; works offline.

## Stack

Vue 3 (Composition API) · Vite · Pinia · Vue Router · Tailwind CSS · vite-plugin-pwa.
Multi-page build: static landing at `/`, SPA at `/app/` with its own PWA scope.

## Develop

```sh
npm install
npm run dev      # http://localhost:5173  (landing at /, app at /app/)
npm test         # Vitest unit tests
npm run build    # production build to dist/
```

## Data model

All data lives in the browser (`localStorage`):

- **workouts** — templates. Each has a `type` (`reps` | `hiit`); reps exercises
  carry `sets`/`reps`, HIIT exercises carry `work`/`rest` seconds plus a
  workout-level `rounds`.
- **sessions** — completed workout history + in-progress check-off state.

## Deploy

Static build on Vercel. `vercel.json` rewrites `/app/*` to the SPA entry so deep
links work. Build command `npm run build`, output directory `dist`.
