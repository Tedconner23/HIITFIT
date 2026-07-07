# Roadmap — Goals, Gap Assessment, Next Steps

*Written 2026-07-07. Gap assessment based on current market leaders: Hevy / Strong (rep
tracking) and Seconds Pro / Tabata Timer / Interval Timer (interval training).*

## Product Goal

A fitness app that eventually ships to the **app stores** (the PWA is the testing
vehicle), supporting:

- **Custom workouts** — user-built, reusable templates.
- **Regular fitness (reps)** — perform by checking off sets. Deliberately *no*
  weight/rep-number logging; the check-off model is the product's simplification.
- **HIIT / Tabata** — time-based training that is **fully automated**: the app tells
  the user when to switch work/rest/exercises with no interaction needed, including
  audio/vibration/notification cues.

## Gap Assessment

### HIIT / interval side (vs Seconds Pro, Tabata Timer, Interval Timer)

Already competitive: custom work/rest × rounds, auto-advancing player, 3-2-1 beep
lead-in, pause/skip, vibration, screen wake lock, "Next: X" preview.

| Gap | Notes |
|---|---|
| **Background operation (screen off / app backgrounded)** | Biggest gap. Current timer is `setInterval` + Web Audio + wake lock — foreground only. Real timer apps cue with the phone locked or music playing. Hard PWA limitation (esp. iOS) — this is the main driver for the Capacitor wrap (local notifications + background audio). |
| Voice announcements ("Next: Burpees") | Seconds Pro's flagship feature. Doable in the PWA now via browser `speechSynthesis` — no deps. |
| Music ducking (cues over Spotify) | Native-only; comes with Capacitor. |
| Rest between rounds | Separate from rest between exercises. |
| Warm-up / cool-down intervals | Standard in timer apps. |
| Total workout progress during play | Elapsed/remaining is only shown pre-start. |
| Color-coded phase display | We have dark/light panels; market standard is full-screen green/red readable from a distance. |
| Sound/vibration/voice settings | No settings screen exists at all. |
| Apple Watch | Native-path item, deferred. |

### Rep / strength side (vs Hevy, Strong)

Already competitive: templates, set check-off with resume, per-exercise rest timer
(+15s/Skip), session history, exercise type-ahead (~96 names), reorder/duplicate.

Gaps that fit the check-off model:

| Gap | Notes |
|---|---|
| Progress / consistency view | Streaks, workouts-per-week, calendar heatmap. Session data already exists — only "last performed" is surfaced. Cheapest high-value addition. |
| Supersets / circuits | Group exercises to alternate between them. |
| Per-exercise notes | Form cues, machine settings. |
| Exercise info | Names only today — no muscle-group tags, instructions, or images. Even tags would help browsing. |
| Session duration | Finish records what was checked, not how long it took. |

Deliberately **out of scope** (different product decisions, not gaps to close):
weight/rep-number logging + PR charts (the core of Hevy/Strong — skipping it is our
simplification; the #1 thing reviewers will compare), social feeds, AI programming,
body measurements. HealthKit is out of scope as *data collection* but integrating it
at Capacitor time also resolves Apple's "wrapped website" rejection risk.

### App-store readiness (cross-cutting)

- Accounts + sync (Phase B, Supabase) so users don't lose data on device switch.
- Settings screen (sound / vibration / voice toggles).
- Onboarding polish.
- Privacy policy URL (required by both stores even for local-only apps).

## Steps to Proceed

**Tier 0 — verification & deploy (unblocks everything else)**
1. Deploy to Vercel (needs user's account; `vercel.json` already verified).
2. Real-device pass: visual review of the UI/UX theme, SwipeRow tap, beep/haptic
   feel, Backup/Restore click-test.

**Tier 1 — complete the "fully automated HIIT" promise (PWA-doable now)**
3. Voice announcements via `speechSynthesis` (announce next exercise, phase changes).
4. Rest-between-rounds + warm-up/cool-down intervals in the HIIT model + player.
5. Total-progress display during play (elapsed / remaining / interval count).
6. Settings screen: sound, vibration, voice toggles.

**Tier 2 — expected polish**
7. Consistency view from existing session data (streaks / weekly counts).
8. Session duration recording on the rep side.
9. Supersets, per-exercise notes, muscle-group tags — pick per demand, not all at once.

**Tier 3 — cloud + stores**
10. Phase B: Supabase auth + `workouts` table sync (last-write-wins by `updatedAt`).
11. Capacitor wrap: local notifications + background audio (fixes the background-timer
    gap), HealthKit integration, store assets + privacy policy, submit.
