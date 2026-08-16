# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# HIITFIT

A workout PWA for planning, creating, and performing workouts on a phone — rep-based
strength workouts (check off sets) and timed HIIT circuits (auto-counting player).
Local-first: works offline, no account required.

## Knowledge files

Detailed project knowledge lives in `knowledge/` as separate files. Read the relevant
one before working on a task — they hold the current build status, decisions, and plan.

- [`knowledge/tech-stack.md`](knowledge/tech-stack.md) — stack, data model, native-app (Capacitor) path, and a dated **Status** log of what's been built
- [`knowledge/roadmap.md`](knowledge/roadmap.md) — product goals, market gap assessment, prioritized next steps

Keep these current: after finishing a unit of work, append to the Status log in
`tech-stack.md`; when priorities shift, update `roadmap.md`.

## Commands

```sh
npm run dev      # Vite dev server → http://localhost:5173 (landing at /, app at /app/)
npm test         # Vitest unit tests (run once)
npm run build    # production build to dist/ (both entry points)
npm run preview  # serve the production build locally
```

There is no single-file test script wired up; target a file with `npx vitest run src/app/hiit.test.js`
(or drop `run` for watch mode).

## Architecture

**Multi-page build, not a single SPA.** Two Vite entry points (see `vite.config.js`
`rollupOptions.input`):

- `index.html` + `src/landing/` — a static marketing landing page at `/`.
- `app/index.html` + `src/app/` — the Vue 3 SPA, served at `/app/`.

The SPA has its **own PWA scope** (`/app/`) so it installs to the home screen
independently of the landing page. The service worker is registered *manually* in
`src/app/main.js` (`vite-plugin-pwa` runs with `injectRegister: false`).

**SPA deep-link fallback is duplicated in two places** and both must stay in sync:
`vue-router` uses `createWebHistory('/app/')`, so a hard load of e.g. `/app/new` must
serve `app/index.html`. That rewrite is handled by the `appSpaFallback` dev middleware
in `vite.config.js` and by the rewrite in `vercel.json` for production. Change one →
change the other.

**State is Pinia, persisted to `localStorage` — no backend yet.** Two stores under
`src/app/stores/`:

- `workouts.js` — workout *templates*. Each has `type: 'reps' | 'hiit'`; reps exercises
  carry `sets`/`reps`/`rest`, HIIT exercises carry `work`/`rest` seconds plus a
  workout-level `rounds`. Also exports `emptyWorkout()` / `emptyExercise()` factories.
- `sessions.js` — in-progress check-off state (perform mode resumes after you leave)
  and the completed-session history log. "Last performed" is *derived* from sessions,
  not stored on the workout.

Each store loads once from `localStorage` and writes back via a `deep` `watch`. Ids are
`crypto.randomUUID()`. This is the layer Phase B will sync to Supabase (last-write-wins
by `updatedAt`) — keep that migration in mind, but **do not** add Supabase, extra
tables, or speculative fields until asked (see the Minimalism constraint in
`tech-stack.md`).

**Views & routing** (`src/app/router.js`): list (`/`) → detail (`/workout/:id`) →
either perform (`/perform/:id`, rep check-off) or the HIIT player (`/hiit/:id`).
`/new` and `/edit/:id` share `EditWorkoutView`.

**Pure logic is factored out of components and unit-tested**: `hiit.js` (builds the
interval timeline), `format.js`, `exercises.js` (the ~96-name type-ahead catalog).
Tests are colocated `*.test.js` (Vitest + jsdom). Prefer putting new non-trivial logic
in a pure module with a test rather than inline in a `.vue` file.

## Constraints

- **Phone-first & offline-first.** Gym wifi is unreliable; the app must work fully
  offline. No user profile data beyond login (Phase B) and saved workouts.
- **Minimalism.** Propose the smallest thing that works; flag speculative additions
  rather than building them.
