# Workout App — Tech Stack & Architecture

## Goal

A workout PWA/website that runs on a phone, allowing users to plan, create, and perform workouts. Multi-user, public.

Modeled technically on [kevinsignal.com](https://www.kevinsignal.com/), built by a friend — useful sounding board for stack questions.

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Vue 3 (Composition API) |
| Build / dev | Vite |
| State | Pinia |
| Routing | Vue Router |
| Styling | Tailwind CSS |
| PWA / offline | vite-plugin-pwa (service worker + installable manifest) |
| Hosting | Vercel (static) |
| Auth + DB | Supabase (Postgres + auth + RLS) |

Architecture mirrors Kevin's: static landing page at `/`, SPA mounted at `/app/` with its own PWA scope so it installs to the home screen independently.

## Data Model

Start with **one table**. Keep exercise/set structure in a JSON column so the schema doesn't churn as the UX evolves.

```sql
workouts (
  id          uuid primary key,
  user_id     uuid references auth.users,
  name        text,
  data        jsonb,        -- exercise list, sets, reps, etc.
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
)
```

RLS policy: users can only read/write rows where `user_id = auth.uid()`.

Add a second table (e.g. `sessions` for performed-workout history) only if/when the feature is decided. Don't pre-build it.

## Constraints

- **Minimalism.** No extra tables, columns, services, or features beyond what's been asked for. Propose the smallest version that works; flag — don't build — speculative additions.
- **PWA first.** Phone-first UI. Must work offline (gym wifi is unreliable).
- **No user profile data.** Only login info (managed by Supabase auth) and saved workouts.

## Native App Path (deferred)

Going native later does **not** require a rewrite. Plan: ship PWA → validate UX → wrap with **Capacitor** when ready.

- `npx cap add ios && npx cap add android` against the Vite `dist/` output
- Same Vue codebase, same Supabase
- Unlocks HealthKit / Health Connect, push notifications, background tasks, haptics, secure storage
- Adjustments needed: Supabase OAuth deep-link handling; move auth session from `localStorage` to Capacitor secure storage
- Apple may reject pure "wrapped website" submissions — integrating HealthKit (natural for a workout app) typically resolves this
- Costs: Apple Developer Program $99/yr, Google Play Console $25 one-time

Tauri 2 is an alternative but much less mature for mobile. Capacitor is the safe choice.

## Status

- [x] Stack decided (2026-05-08)
- [x] Project scaffolded (2026-06-16) — Vite MPA: landing at `/`, Vue SPA at `/app/`, Tailwind v4, Pinia, Vue Router, vite-plugin-pwa scoped to `/app/`
- [x] App flow / UX design decided (2026-06-16) — core model: reusable templates you "perform"; perform = check off sets (no numbers); local-first with optional login. Sync deferred to Phase B.
- [x] Phase A built (2026-06-16) — local-first templates CRUD + perform (check-off), stored in `localStorage` via Pinia. No Supabase yet. Routes: `/` list, `/new`, `/edit/:id`, `/perform/:id`. SPA deep-link fallback in dev (vite.config.js) and prod (vercel.json).
- [x] Local backup (2026-06-16) — Backup (download JSON) / Restore (upload + merge-by-newest) on the workouts screen. Cloud sync declined; staying local-only for now.
- [x] Correctness hardening (2026-06-16) — delete confirmation; Vitest + jsdom unit tests for the store (7 tests: save/update/remove/importMerge). Backup/Restore DOM glue (blob download, file read) not yet click-tested.
- [x] Swipe-to-delete (2026-06-16) — `SwipeRow.vue` (pointer events, no deps); swipe a list row left to reveal Delete (confirms first). Not yet click-tested on a touch device.
- [x] Full session history (2026-06-17) — new local `sessions` store: in-progress check-off state (perform mode resumes after leaving) + completed sessions log. Perform mode now has a "Finish" action that records a session; list rows show "last performed". "Last performed" is derived from sessions, not stored on the workout. Backup/Restore now includes sessions (legacy bare-array backups still import). 12 unit tests total.
- [x] Version control + deploy-ready (2026-06-17) — git initialized, README added; `vercel.json` rewrite verified; production preview serves landing/app/manifest/sw. Deploy itself needs the user's Vercel account (not yet done).
- [x] HIIT mode (2026-06-17) — second workout `type` (`reps` | `hiit`). HIIT = exercises with work/rest seconds × rounds. Reps|HIIT segmented toggle on the list. `HiitPlayerView` auto-countdown player: 3-2-1 lead-in, Web Audio beeps, wake lock, records a session on finish. Pure `hiit.js` timeline builder (unit-tested). Fixed two bugs found via CDP browser-driving: (1) audio-unlock `await` froze the timer — now starts synchronously; (2) saving dropped you on the list's Reps tab (workout seemed to vanish) — now lands on the workout's detail screen. 19 unit tests.
- [x] Refinement batch (2026-06-18) — drawn from successful apps. (1) Rest timer in rep Perform: per-exercise `rest` seconds, auto countdown bar with +15s/Skip + beeps. (2) HIIT player: pause/resume, skip, haptic vibration on transitions. (3) Reorder exercises (↑/↓ buttons) + duplicate workout. (4) First-run sample seeding (Full Body + Tabata) via `seedIfFirstRun()` called from main.js. 21 unit tests; all four verified end-to-end via CDP browser-driving. Beep sound/haptic "feel" still needs the user's own device check.
- [x] UI/UX pass started (2026-06-17) — light/clean theme across app, landing, and manifest. New **Workout Detail** screen (Start · exercise preview · history · edit); tapping a workout opens detail instead of Perform; history moved out of the editor. Real dumbbell app icons. Landing page rebuilt — and fixed: it never loaded a stylesheet before (MPA entry now imports Tailwind via `src/landing/`). Safe-area insets added. NOTE: visual look not yet eyeballed/click-tested (browser automation was down this session) — needs a real-device/browser review.
- [ ] Supabase project created (Phase B)
- [ ] Schema applied (Phase B) — `workouts` table, `data` jsonb, last-write-wins sync by `updatedAt`
- [ ] Phase B: Supabase auth + sync
