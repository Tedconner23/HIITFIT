import { createRouter, createWebHistory } from 'vue-router'
import WorkoutsView from './views/WorkoutsView.vue'
import EditWorkoutView from './views/EditWorkoutView.vue'
import PerformView from './views/PerformView.vue'

const router = createRouter({
  history: createWebHistory('/app/'),
  routes: [
    { path: '/', name: 'workouts', component: WorkoutsView },
    { path: '/new', name: 'new', component: EditWorkoutView },
    { path: '/edit/:id', name: 'edit', component: EditWorkoutView, props: true },
    { path: '/perform/:id', name: 'perform', component: PerformView, props: true },
  ],
})

export default router
