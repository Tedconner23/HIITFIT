# Workout App

A workout PWA for planning, building, and performing workouts on a phone.
Local-first (works offline, no account); see `knowledge/tech-stack.md` for the
full architecture and roadmap.

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

## Data

All data lives in the browser (`localStorage`):

- **workouts** — reusable templates (name + exercises with sets/reps)
- **sessions** — completed workout history + in-progress check-off state

Use **Backup** / **Restore** on the workouts screen to export/import a JSON file.

## Deploy

Static build on Vercel. `vercel.json` rewrites `/app/*` to the SPA entry so deep
links work. Build command `npm run build`, output `dist/`.
