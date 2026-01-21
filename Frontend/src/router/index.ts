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
      meta: { guestOnly: true, title: 'Login' }
    },

    // Si alternás el registro dentro de /login
    {
      path: '/register',
      redirect: '/login'
      // alternativa: redirect: { path: '/login', query: { mode: 'register' } }
    },

    // Protegidas (con layout)
    {
      path: '/',
      component: AppLayout,
      meta: { requiresAuth: true },
      children: [
        // Home privada (debug)
        { path: '', redirect: '/team' },

        {
          path: 'team',
          component: () => import('../views/TeamView.vue'),
          meta: { title: 'Mi Equipo' }
        },
        {
          path: 'dashboard',
          component: () => import('../views/Dashboard.vue'),
          meta: { title: 'Dashboard' }
        },
        {
          path: 'profile',
          component: () => import('../views/Profile.vue'),
          meta: { title: 'Mi Perfil' }
        },

        // ✅ Feedbacks
        {
          path: 'feedbacks',
          component: () => import('../views/FeedbacksView.vue'),
          meta: { title: 'Feedbacks' }
        },
        // {
        //   path: 'feedbacks/new',
        //   component: () => import('../views/FeedbackCreateView.vue'),
        //   meta: { title: 'Nuevo Feedback' }
        // },
        // {
        //   path: 'feedbacks/:id',
        //   component: () => import('../views/FeedbackDetailView.vue'),
        //   meta: { title: 'Detalle de Feedback' }
        // }

        // Notificaciones (cuando exista la vista)
        // {
        //   path: 'notifications',
        //   component: () => import('../views/Notifications.vue'),
        //   meta: { title: 'Notificaciones' }
        // }
      ]
    },

    // 404
    {
      path: '/:pathMatch(.*)*',
      redirect: '/team'
    }
  ]
})

router.beforeEach(authGuard)

export default router