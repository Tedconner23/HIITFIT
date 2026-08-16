-- HIITFIT schema — run once in the Supabase SQL editor.
--
-- One table, per knowledge/tech-stack.md. A row is either:
--   * a user's workout  (user_id = their auth uid), or
--   * a preset          (user_id IS NULL) — readable by everyone, writable by
--     no one through the API (manage presets in the dashboard).
--
-- `data` holds the whole workout object exactly as the app stores it locally
-- (minus ids/timestamps for presets — the app generates those when copying).
-- `updated_at` mirrors data->>'updatedAt' for dashboard sorting; conflict
-- resolution uses the value inside `data`.

create table if not exists public.workouts (
  id         uuid primary key,
  user_id    uuid references auth.users (id) on delete cascade,
  name       text not null default 'Untitled',
  data       jsonb not null,
  updated_at timestamptz not null default now()
);

create index if not exists workouts_user_id_idx on public.workouts (user_id);

alter table public.workouts enable row level security;

drop policy if exists "read own workouts and presets" on public.workouts;
create policy "read own workouts and presets" on public.workouts
  for select using (user_id = auth.uid() or user_id is null);

drop policy if exists "insert own workouts" on public.workouts;
create policy "insert own workouts" on public.workouts
  for insert with check (user_id = auth.uid());

drop policy if exists "update own workouts" on public.workouts;
create policy "update own workouts" on public.workouts
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "delete own workouts" on public.workouts;
create policy "delete own workouts" on public.workouts
  for delete using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Presets (user_id NULL). Re-runnable: wipes and re-inserts all presets.
-- Rep exercises: {name, sets, reps, rest}; HIIT: {name, work, rest} plus
-- workout-level rounds / warmup / cooldown / restBetweenRounds.
-- ---------------------------------------------------------------------------

delete from public.workouts where user_id is null;

insert into public.workouts (id, user_id, name, data) values

-- ------------------------- General rep workouts ---------------------------

(gen_random_uuid(), null, 'Full Body', '{
  "name": "Full Body", "type": "reps", "exercises": [
    {"name": "Push-ups", "sets": 3, "reps": "12", "rest": 60},
    {"name": "Squats", "sets": 3, "reps": "15", "rest": 60},
    {"name": "Plank", "sets": 3, "reps": "30s", "rest": 45}
  ]}'),

(gen_random_uuid(), null, 'Core Crusher', '{
  "name": "Core Crusher", "type": "reps", "exercises": [
    {"name": "Plank", "sets": 3, "reps": "45s", "rest": 45},
    {"name": "Bicycle Crunches", "sets": 3, "reps": "20", "rest": 45},
    {"name": "Russian Twists", "sets": 3, "reps": "20", "rest": 45},
    {"name": "Leg Raises", "sets": 3, "reps": "15", "rest": 45}
  ]}'),

-- --------------------- Condensed PPL — V-Taper biased ---------------------

(gen_random_uuid(), null, 'PPL Push (V-Taper)', '{
  "name": "PPL Push (V-Taper)", "type": "reps", "exercises": [
    {"name": "Machine Shoulder Press", "sets": 4, "reps": "8-12", "rest": 90},
    {"name": "Incline Dumbbell Press", "sets": 3, "reps": "8-12", "rest": 90},
    {"name": "Machine Chest Press", "sets": 3, "reps": "8-12", "rest": 90},
    {"name": "Pec Deck Fly", "sets": 3, "reps": "10-15", "rest": 60},
    {"name": "Dumbbell Lateral Raise", "sets": 5, "reps": "12-20", "rest": 60},
    {"name": "Cable Lateral Raise", "sets": 5, "reps": "12-20", "rest": 60},
    {"name": "Lean-In Lateral Raise", "sets": 5, "reps": "12-20", "rest": 60},
    {"name": "Overhead Cable Triceps Extension", "sets": 5, "reps": "10-15", "rest": 60},
    {"name": "Triceps Pushdown", "sets": 4, "reps": "10-15", "rest": 60},
    {"name": "Dumbbell Wrist Curls", "sets": 3, "reps": "10-15", "rest": 45},
    {"name": "Sideways Dumbbell Wrist Extensions", "sets": 3, "reps": "10-15", "rest": 45},
    {"name": "Cable Reverse Curls", "sets": 3, "reps": "10-15", "rest": 45}
  ]}'),

(gen_random_uuid(), null, 'PPL Pull (V-Taper)', '{
  "name": "PPL Pull (V-Taper)", "type": "reps", "exercises": [
    {"name": "Narrow Neutral-Grip Lat Pulldown", "sets": 4, "reps": "10-15", "rest": 90},
    {"name": "Straight-Arm Cable Pulldown", "sets": 4, "reps": "12-15", "rest": 60},
    {"name": "High-to-Low Cable Row", "sets": 4, "reps": "10-15", "rest": 90},
    {"name": "Single-Arm DB Row on Incline", "sets": 3, "reps": "10-12", "rest": 90},
    {"name": "Single-Arm Lat Pulldown", "sets": 3, "reps": "10-15", "rest": 60},
    {"name": "Reverse Pec Deck", "sets": 5, "reps": "12-20", "rest": 60},
    {"name": "Cable Rear-Delt Fly", "sets": 5, "reps": "12-20", "rest": 60},
    {"name": "Incline Dumbbell Curl", "sets": 3, "reps": "10-15", "rest": 60},
    {"name": "Behind-the-Body Cable Curl", "sets": 3, "reps": "10-15", "rest": 60},
    {"name": "Reverse Preacher Curl", "sets": 3, "reps": "10-15", "rest": 60},
    {"name": "Dead Bug", "sets": 3, "reps": "8-10/side", "rest": 45},
    {"name": "Pallof Press", "sets": 3, "reps": "10-12/side", "rest": 45}
  ]}'),

(gen_random_uuid(), null, 'PPL Legs (V-Taper)', '{
  "name": "PPL Legs (V-Taper)", "type": "reps", "exercises": [
    {"name": "Leg Press", "sets": 4, "reps": "8-12", "rest": 90},
    {"name": "Leg Extension", "sets": 4, "reps": "12-15", "rest": 60},
    {"name": "Dumbbell Romanian Deadlift", "sets": 4, "reps": "8-12", "rest": 90},
    {"name": "Leg Curl", "sets": 4, "reps": "10-15", "rest": 60},
    {"name": "Hip Thrust", "sets": 5, "reps": "10-15", "rest": 90},
    {"name": "Calf Raise", "sets": 6, "reps": "12-20", "rest": 45},
    {"name": "Dumbbell Wrist Curls", "sets": 3, "reps": "10-15", "rest": 45},
    {"name": "Sideways Dumbbell Wrist Extensions", "sets": 3, "reps": "10-15", "rest": 45},
    {"name": "Cable Reverse Curls", "sets": 3, "reps": "10-15", "rest": 45}
  ]}'),

-- ---------------------- Condensed PPL — balanced ---------------------------

(gen_random_uuid(), null, 'PPL Push (Balanced)', '{
  "name": "PPL Push (Balanced)", "type": "reps", "exercises": [
    {"name": "Incline Dumbbell Press", "sets": 4, "reps": "8-12", "rest": 90},
    {"name": "Machine Chest Press", "sets": 4, "reps": "8-12", "rest": 90},
    {"name": "Pec Deck Fly", "sets": 4, "reps": "10-15", "rest": 60},
    {"name": "Machine Shoulder Press", "sets": 4, "reps": "8-12", "rest": 90},
    {"name": "Dumbbell Lateral Raise", "sets": 5, "reps": "12-20", "rest": 60},
    {"name": "Cable Lateral Raise", "sets": 5, "reps": "12-20", "rest": 60},
    {"name": "Overhead Cable Triceps Extension", "sets": 5, "reps": "10-15", "rest": 60},
    {"name": "Triceps Pushdown", "sets": 4, "reps": "10-15", "rest": 60},
    {"name": "Dumbbell Wrist Curls", "sets": 3, "reps": "10-15", "rest": 45},
    {"name": "Sideways Dumbbell Wrist Extensions", "sets": 3, "reps": "10-15", "rest": 45},
    {"name": "Cable Reverse Curls", "sets": 3, "reps": "10-15", "rest": 45}
  ]}'),

(gen_random_uuid(), null, 'PPL Pull (Balanced)', '{
  "name": "PPL Pull (Balanced)", "type": "reps", "exercises": [
    {"name": "Narrow Neutral-Grip Lat Pulldown", "sets": 4, "reps": "10-15", "rest": 90},
    {"name": "High-to-Low Cable Row", "sets": 4, "reps": "10-15", "rest": 90},
    {"name": "Single-Arm DB Row on Incline", "sets": 3, "reps": "10-12", "rest": 90},
    {"name": "Seated Cable Row", "sets": 4, "reps": "8-12", "rest": 90},
    {"name": "Reverse Pec Deck", "sets": 4, "reps": "12-20", "rest": 60},
    {"name": "Cable Rear-Delt Fly", "sets": 4, "reps": "12-20", "rest": 60},
    {"name": "Incline Dumbbell Curl", "sets": 3, "reps": "10-15", "rest": 60},
    {"name": "Behind-the-Body Cable Curl", "sets": 3, "reps": "10-15", "rest": 60},
    {"name": "Reverse Preacher Curl", "sets": 3, "reps": "10-15", "rest": 60},
    {"name": "Dead Bug", "sets": 3, "reps": "8-10/side", "rest": 45},
    {"name": "Pallof Press", "sets": 3, "reps": "10-12/side", "rest": 45}
  ]}'),

(gen_random_uuid(), null, 'PPL Legs (Balanced)', '{
  "name": "PPL Legs (Balanced)", "type": "reps", "exercises": [
    {"name": "Leg Press", "sets": 4, "reps": "8-12", "rest": 90},
    {"name": "Leg Extension", "sets": 4, "reps": "12-15", "rest": 60},
    {"name": "Bulgarian Split Squat", "sets": 4, "reps": "8-12/leg", "rest": 90},
    {"name": "Hip Thrust", "sets": 6, "reps": "10-15", "rest": 90},
    {"name": "Dumbbell Romanian Deadlift", "sets": 6, "reps": "8-12", "rest": 90},
    {"name": "Leg Curl", "sets": 6, "reps": "10-15", "rest": 60},
    {"name": "Calf Raise", "sets": 8, "reps": "12-20", "rest": 45},
    {"name": "Dumbbell Wrist Curls", "sets": 3, "reps": "10-15", "rest": 45},
    {"name": "Sideways Dumbbell Wrist Extensions", "sets": 3, "reps": "10-15", "rest": 45},
    {"name": "Cable Reverse Curls", "sets": 3, "reps": "10-15", "rest": 45}
  ]}'),

-- ----------------------------- Mobility ------------------------------------

(gen_random_uuid(), null, 'Daily Mobility', '{
  "name": "Daily Mobility", "type": "reps", "exercises": [
    {"name": "Band External/Internal Rotations", "sets": 1, "reps": "10-15", "rest": 15},
    {"name": "Pendulum Swings", "sets": 1, "reps": "30s", "rest": 15},
    {"name": "Cross-Body Shoulder Stretch", "sets": 1, "reps": "30-60s", "rest": 15},
    {"name": "Thread the Needle", "sets": 1, "reps": "30-60s", "rest": 15},
    {"name": "Low Doorway Pec Stretch", "sets": 1, "reps": "30-60s", "rest": 15},
    {"name": "Cat-Cow", "sets": 1, "reps": "10", "rest": 15},
    {"name": "Stomach Vacuum", "sets": 3, "reps": "10-20s", "rest": 30}
  ]}'),

-- --------------------------- HIIT workouts ---------------------------------

(gen_random_uuid(), null, 'Tabata', '{
  "name": "Tabata", "type": "hiit", "rounds": 8, "exercises": [
    {"name": "Burpees", "work": 20, "rest": 10}
  ]}'),

(gen_random_uuid(), null, 'HIIT Circuit', '{
  "name": "HIIT Circuit", "type": "hiit", "rounds": 3, "exercises": [
    {"name": "Jumping Jacks", "work": 40, "rest": 20},
    {"name": "Mountain Climbers", "work": 40, "rest": 20},
    {"name": "High Knees", "work": 40, "rest": 20},
    {"name": "Squat Jumps", "work": 40, "rest": 20}
  ]}'),

(gen_random_uuid(), null, 'Cardio Blast', '{
  "name": "Cardio Blast", "type": "hiit", "rounds": 4, "exercises": [
    {"name": "Burpees", "work": 30, "rest": 15},
    {"name": "Skaters", "work": 30, "rest": 15},
    {"name": "Box Jumps", "work": 30, "rest": 15}
  ]}'),

(gen_random_uuid(), null, 'Express 15', '{
  "name": "Express 15", "type": "hiit", "rounds": 2,
  "warmup": 300, "cooldown": 300, "restBetweenRounds": 60, "exercises": [
    {"name": "High Knees", "work": 40, "rest": 20},
    {"name": "Push-ups", "work": 40, "rest": 20},
    {"name": "Squat Jumps", "work": 40, "rest": 20},
    {"name": "Plank Shoulder Taps", "work": 40, "rest": 20},
    {"name": "Mountain Climbers", "work": 40, "rest": 20},
    {"name": "Reverse Lunges", "work": 40, "rest": 20}
  ]}'),

(gen_random_uuid(), null, 'Slam-Ball Blaster', '{
  "name": "Slam-Ball Blaster", "type": "hiit", "rounds": 4,
  "warmup": 300, "cooldown": 300, "restBetweenRounds": 75, "exercises": [
    {"name": "Overhead Ball Slams", "work": 40, "rest": 20},
    {"name": "Med-Ball Russian Twist", "work": 40, "rest": 20},
    {"name": "Med-Ball Thruster", "work": 40, "rest": 20},
    {"name": "Mountain Climbers", "work": 40, "rest": 20}
  ]}'),

(gen_random_uuid(), null, 'Dumbbell Metcon', '{
  "name": "Dumbbell Metcon", "type": "hiit", "rounds": 3,
  "warmup": 300, "cooldown": 300, "restBetweenRounds": 90, "exercises": [
    {"name": "DB Thrusters", "work": 40, "rest": 20},
    {"name": "Renegade Rows", "work": 40, "rest": 20},
    {"name": "DB Reverse Lunges", "work": 40, "rest": 20},
    {"name": "Handle Push-ups", "work": 40, "rest": 20},
    {"name": "DB Swings", "work": 40, "rest": 20},
    {"name": "Bench Step-ups", "work": 40, "rest": 20}
  ]}'),

(gen_random_uuid(), null, 'Band Burner (Low Impact)', '{
  "name": "Band Burner (Low Impact)", "type": "hiit", "rounds": 2,
  "warmup": 300, "cooldown": 300, "restBetweenRounds": 60, "exercises": [
    {"name": "Banded Fast Feet", "work": 40, "rest": 20},
    {"name": "Band Squat-to-Press", "work": 40, "rest": 20},
    {"name": "Banded Lateral Shuffle", "work": 40, "rest": 20},
    {"name": "Band Woodchopper", "work": 40, "rest": 20},
    {"name": "Step-Jacks", "work": 40, "rest": 20},
    {"name": "Push-ups", "work": 40, "rest": 20}
  ]}'),

(gen_random_uuid(), null, '5-Min Finisher', '{
  "name": "5-Min Finisher", "type": "hiit", "rounds": 8,
  "cooldown": 60, "exercises": [
    {"name": "Ball Slams", "work": 20, "rest": 10}
  ]}');
