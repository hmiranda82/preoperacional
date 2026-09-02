import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
declare module 'vue-router' {
  interface RouteMeta { requiresAuth?:boolean; guestOnly?:boolean; title?:string }
}
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path:'/', redirect:'/dashboard' },
    { path:'/login',          component:()=>import('../views/LoginView.vue'),         meta:{guestOnly:true,   title:'Iniciar sesión'} },
    { path:'/dashboard',      component:()=>import('../views/DashboardView.vue'),     meta:{requiresAuth:true, title:'Dashboard'} },
    { path:'/responses',      component:()=>import('../views/ResponsesView.vue'),     meta:{requiresAuth:true, title:'Respuestas'} },
    { path:'/reports',        component:()=>import('../views/ReportView.vue'),       meta:{requiresAuth:true, title:'Reportes'} },
    { path:'/users',          component:()=>import('../views/UsersView.vue'),         meta:{requiresAuth:true, title:'Usuarios'} },
    { path:'/questions',      component:()=>import('../views/QuestionsView.vue'),     meta:{requiresAuth:true, title:'Preguntas'} },
    { path:'/companies',      component:()=>import('../views/CompaniesView.vue'),     meta:{requiresAuth:true, title:'Empresas'} },
    { path:'/vacations',      component:()=>import('../views/VacationsView.vue'),    meta:{requiresAuth:true, title:'Vacaciones'} },
    { path:'/ausencias',      component:()=>import('../views/AusenciasView.vue'),   meta:{requiresAuth:true, title:'Ausencias'} },
    { path:'/:pathMatch(.*)*', redirect:'/dashboard' },
  ],
})
router.beforeEach((to) => {
  const auth = useAuthStore()
  const isLoggedIn = auth.isLoggedIn
  const userRole = auth.user?.rol

  // 1. Redirigir a login si la ruta requiere auth y no está logueado
  if (to.meta.requiresAuth && !isLoggedIn) return '/login'

  // 2. Redirigir a dashboard si la ruta es solo para invitados y está logueado
  if (to.meta.guestOnly && isLoggedIn) return '/dashboard'

  // 3. Control de acceso por rol (ADMIN / SUPER_ROOT vs CONDUCTOR)
  const adminRoutes = ['/dashboard', '/responses', '/reports', '/users', '/questions', '/companies', '/vacations', '/ausencias']
  const isAdminRoute = adminRoutes.some(path => to.path.startsWith(path))

  // Conductor u otro rol sin permisos intenta acceder a rutas de admin.
  if (isAdminRoute && isLoggedIn && userRole !== 'ADMIN' && userRole !== 'SUPER_ROOT') {
    const authStore = useAuthStore()
    authStore.logout()
    return { path: '/login', query: { error: 'sin_acceso' } }
  }
})
export default router