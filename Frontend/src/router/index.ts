import { createRouter, createWebHistory } from 'vue-router'
import { authGuard } from '../middleware/auth'
import AppLayout from '../layout/AppLayout.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    // Públicas
    {
      path: '/login',
      component: () => import('../views/LoginView.vue'),
      meta: { guestOnly: true }
    },

    // Protegidas (con layout)
    {
      path: '/',
      component: AppLayout,
      meta: { requiresAuth: true },
      children: [
        { path: '', redirect: '/team' },
        {
          path: 'team',
          component: () => import('../../src/views/TeamView.vue')
        },
        {
          path: 'dashboard',
          component: () => import('../../src/views/Dashboard.vue')
        },
        {
          path: 'profile',
          component: () => import('../../src/views/Profile.vue')
        }
      ]
    }
  ]
})

router.beforeEach(authGuard)
export default router