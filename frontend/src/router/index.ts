import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) return { el: to.hash, behavior: 'smooth' }
    return { top: 0 }
  },
  routes: [
    { path: '/', name: 'home', component: HomeView },
    {
      path: '/calendar',
      name: 'calendar',
      component: () => import('@/views/CalendarView.vue'),
    },
    {
      path: '/stores',
      name: 'stores',
      component: () => import('@/views/StoresView.vue'),
    },
    {
      path: '/stores/:id(\\d+)',
      name: 'store-detail',
      component: () => import('@/views/StoreDetailView.vue'),
    },
    {
      path: '/materials',
      name: 'materials',
      component: () => import('@/views/MaterialsView.vue'),
    },
    {
      path: '/request',
      name: 'request',
      component: () => import('@/views/RequestView.vue'),
    },
    {
      path: '/contest',
      name: 'contest',
      component: () => import('@/views/ContestView.vue'),
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

export default router
