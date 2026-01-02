import { createRouter, createWebHistory } from 'vue-router'
import { authGuard } from '../middleware/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/dashboard' },

    // Públicas
    {
      path: '/login',
      component: () => import('../views/Login.vue'),
      meta: { guestOnly: true }
    },
    {
      path: '/register',
      component: () => import('../views/Register.vue'),
      meta: { guestOnly: true }
    },

    // Protegidas
    {
      path: '/dashboard',
      component: () => import('../views/Dashboard.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/feedbacks/:pathMatch(.*)*',
      component: () => import('../views/Feedbacks.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/profile',
      component: () => import('../views/Profile.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/team',
      component: () => import('../views/Team.vue'),
      meta: { requiresAuth: true }
    },
    // {
    //   path: '/notifications',
    //   component: () => import('../views/Notifications.vue'),
    //   meta: { requiresAuth: true }
    // },
  ]
})

// Guard global
router.beforeEach(authGuard)

export default router