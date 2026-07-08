import { createRouter, createWebHistory } from 'vue-router'
import WorkoutsView from './views/WorkoutsView.vue'
import WorkoutDetailView from './views/WorkoutDetailView.vue'
import EditWorkoutView from './views/EditWorkoutView.vue'
import PerformView from './views/PerformView.vue'
import HiitPlayerView from './views/HiitPlayerView.vue'
import ConsistencyView from './views/ConsistencyView.vue'
import SettingsView from './views/SettingsView.vue'

const router = createRouter({
  history: createWebHistory('/app/'),
  routes: [
    { path: '/', name: 'workouts', component: WorkoutsView },
    { path: '/new', name: 'new', component: EditWorkoutView },
    { path: '/workout/:id', name: 'detail', component: WorkoutDetailView, props: true },
    { path: '/edit/:id', name: 'edit', component: EditWorkoutView, props: true },
    { path: '/perform/:id', name: 'perform', component: PerformView, props: true },
    { path: '/hiit/:id', name: 'hiit', component: HiitPlayerView, props: true },
    { path: '/consistency', name: 'consistency', component: ConsistencyView },
    { path: '/settings', name: 'settings', component: SettingsView },
  ],
})

export default router
