<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useWorkoutsStore } from '../stores/workouts'
import { useSessionsStore } from '../stores/sessions'
import { formatDate } from '../format'

const props = defineProps({ id: { type: String, required: true } })

const store = useWorkoutsStore()
const sessions = useSessionsStore()
const workout = computed(() => store.get(props.id))
const history = computed(() => sessions.sessionsFor(props.id))
</script>

<template>
  <template v-if="workout">
    <header class="flex items-center justify-between py-6">
      <RouterLink :to="{ name: 'workouts' }" class="text-neutral-400">‹ Workouts</RouterLink>
      <RouterLink
        :to="{ name: 'edit', params: { id: workout.id } }"
        class="text-sm text-neutral-500"
      >
        Edit
      </RouterLink>
    </header>

    <h1 class="text-2xl font-semibold tracking-tight">{{ workout.name || 'Untitled' }}</h1>
    <p class="mt-1 text-sm text-neutral-400">
      {{ workout.exercises.length }}
      {{ workout.exercises.length === 1 ? 'exercise' : 'exercises' }}
    </p>

    <RouterLink
      :to="{ name: 'perform', params: { id: workout.id } }"
      class="mt-6 block rounded-2xl bg-neutral-900 py-4 text-center font-medium text-white"
    >
      Start workout
    </RouterLink>

    <ul class="mt-6 flex flex-col gap-2">
      <li
        v-for="ex in workout.exercises"
        :key="ex.id"
        class="flex items-center justify-between rounded-xl border border-neutral-200 bg-white px-4 py-3"
      >
        <span class="font-medium">{{ ex.name || 'Exercise' }}</span>
        <span class="text-sm text-neutral-400">{{ ex.sets }} × {{ ex.reps }}</span>
      </li>
    </ul>

    <section v-if="history.length" class="mt-8">
      <h2 class="mb-3 text-sm font-medium text-neutral-500">History</h2>
      <ul class="flex flex-col gap-2">
        <li
          v-for="s in history"
          :key="s.id"
          class="flex justify-between rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm"
        >
          <span>{{ formatDate(s.completedAt) }}</span>
          <span class="text-neutral-400">{{ s.setsDone }}/{{ s.setsTotal }} sets</span>
        </li>
      </ul>
    </section>
  </template>

  <p v-else class="py-12 text-center text-neutral-400">Workout not found.</p>
</template>
