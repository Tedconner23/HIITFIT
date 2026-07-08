<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useSessionsStore } from '../stores/sessions'
import { dayKey, activeDays, computeStreaks, workoutsThisWeek, heatmap } from '../stats'

const sessions = useSessionsStore()

const today = dayKey(new Date())
const days = computed(() => activeDays(sessions.sessions))
const streaks = computed(() => computeStreaks(days.value, today))
const thisWeek = computed(() => workoutsThisWeek(days.value, today))
const total = computed(() => days.value.size)
const grid = computed(() => heatmap(sessions.sessions, today, 12))

// Tailwind classes for a cell's activity level (0 = none … 3 = 3+ sessions).
function cellClass(cell) {
  if (cell.future) return 'bg-transparent'
  const n = cell.count
  if (n === 0) return 'bg-neutral-100'
  if (n === 1) return 'bg-neutral-300'
  if (n === 2) return 'bg-neutral-500'
  return 'bg-neutral-900'
}

const dayLabels = ['M', '', 'W', '', 'F', '', '']
</script>

<template>
  <header class="flex items-center justify-between py-6">
    <RouterLink :to="{ name: 'workouts' }" class="text-neutral-400">‹ Workouts</RouterLink>
    <h1 class="text-lg font-semibold">Consistency</h1>
    <span class="w-16"></span>
  </header>

  <div class="grid grid-cols-3 gap-3">
    <div class="rounded-2xl border border-neutral-200 bg-white px-4 py-5 text-center">
      <p class="text-3xl font-semibold tabular-nums">{{ streaks.current }}</p>
      <p class="mt-1 text-xs text-neutral-400">Day streak</p>
    </div>
    <div class="rounded-2xl border border-neutral-200 bg-white px-4 py-5 text-center">
      <p class="text-3xl font-semibold tabular-nums">{{ streaks.longest }}</p>
      <p class="mt-1 text-xs text-neutral-400">Longest</p>
    </div>
    <div class="rounded-2xl border border-neutral-200 bg-white px-4 py-5 text-center">
      <p class="text-3xl font-semibold tabular-nums">{{ thisWeek }}</p>
      <p class="mt-1 text-xs text-neutral-400">This week</p>
    </div>
  </div>

  <section class="mt-8">
    <div class="mb-3 flex items-baseline justify-between">
      <h2 class="text-sm font-medium text-neutral-500">Last 12 weeks</h2>
      <span class="text-xs text-neutral-400">{{ total }} active {{ total === 1 ? 'day' : 'days' }}</span>
    </div>

    <div class="flex gap-1.5 overflow-x-auto pb-1">
      <div class="mr-1 flex flex-col gap-1 pt-0.5 text-[10px] text-neutral-300">
        <span v-for="(d, i) in dayLabels" :key="i" class="h-4 leading-4">{{ d }}</span>
      </div>
      <div v-for="(week, wi) in grid" :key="wi" class="flex flex-col gap-1">
        <div
          v-for="cell in week"
          :key="cell.key"
          class="h-4 w-4 rounded-sm"
          :class="cellClass(cell)"
          :title="`${cell.key}: ${cell.count} workout${cell.count === 1 ? '' : 's'}`"
        ></div>
      </div>
    </div>

    <div class="mt-3 flex items-center justify-end gap-1.5 text-xs text-neutral-400">
      <span>Less</span>
      <span class="h-3 w-3 rounded-sm bg-neutral-100"></span>
      <span class="h-3 w-3 rounded-sm bg-neutral-300"></span>
      <span class="h-3 w-3 rounded-sm bg-neutral-500"></span>
      <span class="h-3 w-3 rounded-sm bg-neutral-900"></span>
      <span>More</span>
    </div>
  </section>

  <p v-if="total === 0" class="mt-8 text-center text-sm text-neutral-400">
    No workouts logged yet. Finish a workout to start your streak.
  </p>
</template>
