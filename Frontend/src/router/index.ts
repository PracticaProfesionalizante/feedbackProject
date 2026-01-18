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

    // (Opcional) Si no usás vista /register porque alternás formulario dentro de /login
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
        // Home privada (para debugging ahora)
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
        }

        // Si después agregás notificaciones:
        // {
        //   path: 'notifications',
        //   component: () => import('../views/Notifications.vue'),
        //   meta: { title: 'Notificaciones' }
        // },

        // Feedbacks:
        // {
        //   path: 'feedbacks/:pathMatch(.*)*',
        //   component: () => import('../views/Feedbacks.vue'),
        //   meta: { title: 'Feedbacks' }
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