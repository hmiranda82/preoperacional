import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

declare module 'vue-router' {
  interface RouteMeta { requiresAuth?: boolean; guestOnly?: boolean }
}

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/',             redirect: '/inspeccionar' },
    { path: '/login',        component: () => import('../views/LoginView.vue'),      meta: { guestOnly: true } },
    { path: '/inspeccionar', component: () => import('../views/FormularioView.vue'), meta: { requiresAuth: true } },
    { path: '/historial',    component: () => import('../views/HistorialView.vue'),  meta: { requiresAuth: true } },
    { path: '/perfil',       component: () => import('../views/PerfilView.vue'),     meta: { requiresAuth: true } },
    { path: '/formulario',   redirect: '/inspeccionar' },
    { path: '/:pathMatch(.*)*', redirect: '/inspeccionar' },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()

  if (to.meta.requiresAuth && !auth.isLoggedIn) return '/login'

  // Si un ADMIN intenta usar la app de conductores, cerrar sesión
  if (to.meta.requiresAuth && auth.isLoggedIn && !auth.isDriver) {
    auth.logout()
    return { path: '/login', query: { from: 'not_driver' } }
  }

  if (to.meta.guestOnly && auth.isLoggedIn) return '/inspeccionar'
})

export default router
