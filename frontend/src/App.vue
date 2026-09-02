<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from './stores/auth'
import api from './api'
import LoadingScreen from './components/LoadingScreen.vue'

const route   = useRoute()
const router  = useRouter()
const auth    = useAuthStore()

// Preloader: solo en primer acceso SIN sesión.
// Si hay token (recarga con sesión activa) → salta directo al dashboard.
// Al cerrar sesión → se marca un flag en sessionStorage para saltar el preloader.
const loading = ref(false)

// Primer acceso: sin token, sin flag de logout → mostrar preloader
const justLoggedOut = sessionStorage.getItem('just_logged_out') === 'true'
if (!sessionStorage.getItem('token') && !justLoggedOut) {
  loading.value = true
}
// Limpiar el flag por si acaso
sessionStorage.removeItem('just_logged_out')
const sidebar       = ref(true)
const mobileOpen    = ref(false)   // sidebar visible on mobile
const profileOpen   = ref(false)
const profileRef    = ref<HTMLElement|null>(null)
const notifOpen     = ref(false)
const notifRef      = ref<HTMLElement|null>(null)
// Cierra el panel de notificaciones si se hace clic fuera
function closeNotif(e: MouseEvent) {
  if (notifRef.value && !notifRef.value.contains(e.target as Node)) notifOpen.value = false
}

// Cierra sidebar y dropdowns al cambiar de ruta
watch(() => route.path, () => {
  mobileOpen.value  = false
  profileOpen.value = false
  notifOpen.value   = false
})

// Notificaciones con estado de lectura
interface Notif {
  id:        number
  text:      string
  time:      string
  read:      boolean
  icon:      string
  createdAt: string
}

const notifications = ref<Notif[]>([])
let fetchTimer: ReturnType<typeof setInterval> | null = null

const unreadList = computed(() =>
  notifications.value.filter(n => !n.read),
)

const unreadCount = computed(() => unreadList.value.length)

async function fetchNotifications() {
  if (!auth.isLoggedIn) return
  try {
    const res = await api.get<Notif[]>('/notifications')
    notifications.value = res.data
  } catch {
    // Silently fail - notifications are non-critical
  }
}

async function openNotif() {
  notifOpen.value = !notifOpen.value
  if (notifOpen.value) {
    fetchNotifications()
  }
}

async function markRead(n: Notif) {
  if (n.read) return
  await api.patch(`/notifications/${n.id}/read`).catch(() => {})
  n.read = true
}

const isLogin = computed(() => route.path === '/login')

const initials = computed(() =>
  (auth.user?.nombre || 'AD').split(' ').map((w:string)=>w[0]).join('').toUpperCase().slice(0,2)
)

async function logout() {
  profileOpen.value = false
  mobileOpen.value  = false
  if (fetchTimer) { clearInterval(fetchTimer); fetchTimer = null }
  await auth.logout()
  sessionStorage.setItem('just_logged_out', 'true')
  loading.value = false
  router.push('/login')
}
function goPassword() {
  profileOpen.value = false
  router.push('/password')
}
function closeProfile(e: MouseEvent) {
  if (profileRef.value && !profileRef.value.contains(e.target as Node)) profileOpen.value=false
}
onMounted(()=>{
  document.addEventListener('click',closeProfile)
  document.addEventListener('click',closeNotif)
  fetchNotifications()
  fetchTimer = setInterval(fetchNotifications, 30000)
})
onUnmounted(()=>{
  document.removeEventListener('click',closeProfile)
  document.removeEventListener('click',closeNotif)
  if (fetchTimer) clearInterval(fetchTimer)
})

const navItems = computed(() => {
  const items = [
    { title:'Dashboard', icon:'dashboard', to:'/dashboard' },
    { title:'Usuarios',  icon:'users',     to:'/users'      },
    { title:'Preguntas', icon:'questions', to:'/questions'  },
    { title:'Historial', icon:'history',   to:'/responses'  },
    { title:'Vacaciones',icon:'vacations', to:'/vacations'  },
    { title:'Ausencias', icon:'ban',      to:'/ausencias'  },
  ]
  if (auth.user?.rol === 'SUPER_ROOT') {
    items.push({ title:'Empresas', icon:'building', to:'/companies' })
  }
  return items
})

const logoSrc = new URL('@/assets/logo.png', import.meta.url).href
//const logoSrc = '/logo.png'  // Coloca tu imagen en frontend/public/logo.png
</script>

<template>
  <LoadingScreen v-if="loading" @done="loading=false" />

  <div v-else class="app" :class="{'app--login':isLogin}">

    <!-- ══ SIDEBAR ══ -->
    <!-- Overlay FUERA del aside: un padre con CSS transform crea un nuevo stacking
         context que atrapa los hijos position:fixed, bloqueando los clicks en móvil -->
    <div
      v-if="!isLogin"
      class="sidebar-overlay"
      :class="{'sidebar-overlay--on': mobileOpen}"
      @click="mobileOpen=false"
    ></div>

    <aside v-if="!isLogin" class="sidebar"
      :class="{'sidebar--slim':!sidebar, 'sidebar--mobile-open': mobileOpen}">

      <!-- Logo block -->
      <div class="sb-logo-block">
        <div class="sb-logo-img-wrap">
          <img :src="logoSrc" alt="Logo" class="sb-logo-img" />
        </div>
        <Transition name="lbl">
          <div v-if="sidebar" class="sb-brand-text">
            <span class="sb-brand-name">PREOPERACIONAL</span>
            <span class="sb-brand-name">{{ auth.user?.nombre?.split(' ')[0] || 'ADMIN' }}</span>
          </div>
        </Transition>
      </div>

      <!-- Navigation -->
      <nav class="sb-nav">
        <router-link
          v-for="item in navItems" :key="item.to" :to="item.to"
          class="sb-item" :class="{'sb-item--active': route.path === item.to}"
          @click="mobileOpen = false"
        >
          <span class="sb-item-indicator" v-if="route.path === item.to"></span>
          <span class="sb-ico">
            <!-- Dashboard -->
            <svg v-if="item.icon==='dashboard'" width="18" height="18" viewBox="0 0 18 18" fill="none">
              <rect x="1" y="1" width="7" height="7" rx="2" stroke="currentColor" stroke-width="1.4"/>
              <rect x="10" y="1" width="7" height="7" rx="2" stroke="currentColor" stroke-width="1.4"/>
              <rect x="1" y="10" width="7" height="7" rx="2" stroke="currentColor" stroke-width="1.4"/>
              <rect x="10" y="10" width="7" height="7" rx="2" stroke="currentColor" stroke-width="1.4"/>
            </svg>
            <!-- Users -->
            <svg v-else-if="item.icon==='users'" width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle cx="7" cy="6" r="3" stroke="currentColor" stroke-width="1.4"/>
              <path d="M1.5 16c0-3 2.5-5.5 5.5-5.5s5.5 2.5 5.5 5.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
              <path d="M12 4.5c1.4.4 2.5 1.6 2.5 3.1 0 1.3-.8 2.4-2 2.8M15 16c0-2-1.1-3.7-2.5-4.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
            </svg>
            <!-- Questions -->
            <svg v-else-if="item.icon==='questions'" width="18" height="18" viewBox="0 0 18 18" fill="none">
              <rect x="2" y="2" width="14" height="14" rx="3" stroke="currentColor" stroke-width="1.4"/>
              <path d="M7 7.2c.2-1 1-1.7 2-1.7 1.1 0 2 .9 2 2 0 .9-.6 1.4-1.2 1.9-.5.3-.8.9-.8 1.6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
              <circle cx="9" cy="12.5" r=".8" fill="currentColor"/>
            </svg>
            <!-- History -->
            <svg v-else-if="item.icon==='history'" width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle cx="9" cy="9" r="7.5" stroke="currentColor" stroke-width="1.4"/>
              <path d="M9 5v4.5l3 2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <!-- Vacations -->
            <svg v-else-if="item.icon==='vacations'" width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M5 6l2-4h4l2 4M5 6v6a1 1 0 001 1h6a1 1 0 001-1V6M9 11v3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
              <path d="M4 3h10" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
            </svg>
            <!-- Ausencias (ban) -->
            <svg v-else-if="item.icon==='ban'" width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle cx="9" cy="9" r="7" stroke="currentColor" stroke-width="1.4"/>
              <path d="M5.5 5.5l7 7" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
            </svg>
            <!-- Building -->
            <svg v-else-if="item.icon==='building'" width="18" height="18" viewBox="0 0 18 18" fill="none">
              <rect x="2" y="2" width="14" height="14" rx="2" stroke="currentColor" stroke-width="1.4"/>
              <path d="M6 2v4h6V2M5 10h2v2H5v-2ZM11 10h2v2h-2v-2ZM8 10h2v2H8v-2Z" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <!-- Settings -->
            <svg v-else-if="item.icon==='settings'" width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle cx="9" cy="9" r="2.5" stroke="currentColor" stroke-width="1.4"/>
              <path d="M9 1.5v2M9 14.5v2M1.5 9h2M14.5 9h2M3.6 3.6l1.4 1.4M13 13l1.4 1.4M3.6 14.4l1.4-1.4M13 5l1.4-1.4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
            </svg>
          </span>
          <Transition name="lbl">
            <span v-if="sidebar" class="sb-lbl">{{ item.title }}</span>
          </Transition>
        </router-link>
      </nav>

      <!-- Admin user at bottom -->
      <div class="sb-bottom">
        <div class="sb-divider"></div>
        <div class="sb-admin" :class="{'sb-admin--slim':!sidebar}">
          <div class="sb-admin-av">{{ initials }}</div>
          <Transition name="lbl">
            <div v-if="sidebar" class="sb-admin-info">
              <span class="sb-admin-name">{{ auth.user?.nombre || 'Admin' }}</span>
              <span class="sb-admin-email">{{ auth.user?.email }}</span>
            </div>
          </Transition>
        </div>
        <button class="sb-toggle" @click="sidebar=!sidebar" :title="sidebar?'Colapsar':'Expandir'">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
            :style="{transform:sidebar?'none':'rotate(180deg)',transition:'transform .3s'}">
            <path d="M7.5 2.5L4 6l3.5 3.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    </aside>

    <!-- ══ MAIN ══ -->
    <div v-if="!isLogin" class="main">

      <!-- TOPBAR — search + notifications + user chip -->
      <header class="topbar">
        <!-- Hamburguesa: solo visible en móvil -->
        <button class="tb-hamburger" aria-label="Menú" @click="mobileOpen=!mobileOpen">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
          </svg>
        </button>



        <div class="tb-right">
          <!-- Bell + notificaciones dropdown -->
          <div class="notif-wrap" ref="notifRef">
            <button class="tb-bell" aria-label="Notificaciones" @click.stop="openNotif()">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M9 2a4.5 4.5 0 0 0-4.5 4.5v3L3 12h12l-1.5-2.5V6.5A4.5 4.5 0 0 0 9 2ZM7.5 14.5a1.5 1.5 0 0 0 3 0" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
              </svg>
              <span v-if="unreadCount > 0" class="tb-bell-badge">{{ unreadCount }}</span>
            </button>

            <Transition name="drop">
              <div v-if="notifOpen" class="notif-drop">
                <div class="notif-drop-head">
                  <span>Notificaciones</span>
                  <span class="notif-count" :class="{'nc-zero': unreadCount === 0}">{{ unreadCount }}</span>
                </div>
                <ul class="notif-list">
                  <li v-if="unreadList.length === 0" class="notif-empty">
                    <p>No hay notificaciones pendientes</p>
                  </li>
                  <li
                    v-for="n in unreadList" :key="n.id"
                    class="notif-item"
                    @click="markRead(n)"
                  >
                    <div class="notif-icon" :class="`ni-${n.icon ?? 'ok'}`">
                      <svg v-if="n.icon === 'doc'" width="13" height="13" viewBox="0 0 13 13" fill="none"><rect x="1.5" y="1" width="10" height="11" rx="2" stroke="currentColor" stroke-width="1.2"/><path d="M4 4.5h5M4 7h3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>
                      <svg v-else-if="n.icon === 'user'" width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="6.5" cy="4.5" r="2" stroke="currentColor" stroke-width="1.2"/><path d="M2 11.5c0-2.5 2-4.5 4.5-4.5s4.5 2 4.5 4.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>
                      <svg v-else width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="6.5" cy="6.5" r="5" stroke="currentColor" stroke-width="1.2"/><path d="M4.5 6.5l1.5 1.5 2.5-2.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    </div>
                    <div class="notif-body">
                      <p class="notif-text">{{ n.text }}</p>
                      <p class="notif-time">{{ n.time }}</p>
                    </div>
                    <span class="notif-unread-dot"></span>
                  </li>
                </ul>
              </div>
            </Transition>
          </div>

          <!-- Profile chip -->
          <div class="profile-wrap" ref="profileRef">
            <button class="profile-chip" @click.stop="profileOpen=!profileOpen">
              <div class="pc-av">{{ initials }}</div>
              <span class="pc-name">{{ auth.user?.nombre?.split(' ')[0] || 'Admin' }}</span>
              <svg class="pc-chevron" :class="{'pc-chevron--up':profileOpen}" width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2.5 4.5L6 8l3.5-3.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>

            <!-- Dropdown -->
            <Transition name="drop">
              <div v-if="profileOpen" class="profile-drop">
                <div class="pd-head">
                  <div class="pd-av">{{ initials }}</div>
                  <div class="pd-info">
                    <p class="pd-name">{{ auth.user?.nombre }}</p>
                    <p class="pd-email">{{ auth.user?.email }}</p>
                    <span class="pd-badge">ADMIN PRINCIPAL</span>
                  </div>
                </div>
                <div class="pd-sep"></div>
                <div class="pd-menu">
                  <button class="pd-item" @click="goPassword">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="2.5" y="6" width="9" height="6.5" rx="1.5" stroke="currentColor" stroke-width="1.3"/><path d="M4.5 6V4.5a2.5 2.5 0 0 1 5 0V6" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><circle cx="7" cy="9.3" r="1" fill="currentColor"/></svg>
                    Cambiar contraseña
                  </button>
                  <button class="pd-item pd-logout" @click="logout">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 12H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h2M9 10l3-3-3-3M6 7h6" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    Cerrar sesión
                  </button>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </header>

      <!-- Content -->
      <main class="content">
        <router-view v-slot="{Component}">
          <Transition name="page" mode="out-in">
            <component :is="Component" />
          </Transition>
        </router-view>
      </main>
    </div>

    <!-- Login standalone -->
    <router-view v-if="isLogin" />
  </div>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800;900&family=Barlow:wght@400;500;600;700;800&display=swap');
*,*::before,*::after{box-sizing:border-box}
html,body{margin:0;padding:0;font-family:'Barlow',sans-serif}
:root{
  --navy:#1a2540;--navy-dark:#0d1422;--navy-light:#243354;
  --red:#e63d2f;--red-dark:#c42d20;
  --bg:#f2f4f7;--surface:#fff;--border:#e4e7ed;
  --text:#0d1422;--text2:#4a5568;--text3:#8895a7;
  --shadow-sm:0 1px 3px rgba(0,0,0,.06),0 2px 8px rgba(0,0,0,.04);
  --shadow-md:0 4px 16px rgba(0,0,0,.08),0 1px 4px rgba(0,0,0,.04);
}
</style>

<style scoped>
.app{display:flex;min-height:100vh;background:var(--bg)}
.app--login{display:block}

/* ══ SIDEBAR ══ */
.sidebar{
  width:220px;flex-shrink:0;
  background:var(--navy);min-height:100vh;position:sticky;top:0;height:100vh;
  display:flex;flex-direction:column;
  transition:width .25s cubic-bezier(.4,0,.2,1);overflow:hidden;
}
.sidebar--slim{width:62px}

.sb-logo-block{
  display:flex;
  align-items:center;
  gap:10px;
  padding:20px 14px 16px;
  flex-shrink:0;

  background: transparent; /* 👈 clave */
  border-bottom:1px solid rgba(255,255,255,.06);
}
/*
.sb-logo-block{
  display:flex;align-items:center;gap:10px;
  padding:20px 14px 16px;flex-shrink:0;
  border-bottom:1px solid rgba(255,255,255,.06);
}
*/
.sb-logo-img-wrap{width:36px;height:36px;flex-shrink:0}
.sb-logo-img{width:120%;height:120%;object-fit:contain;border-radius:10%}
.sb-brand-text{display:flex;flex-direction:column;white-space:nowrap;overflow:hidden}
.sb-brand-name{color:#fff;font-family:'Barlow Condensed',sans-serif;font-size:13px;font-weight:800;letter-spacing:.5px;line-height:1.15}
.sb-brand-sub{color:rgba(255,255,255,.35);font-family:'Barlow Condensed',sans-serif;font-size:9px;font-weight:600;letter-spacing:1.5px;margin-top:2px}

.sb-nav{flex:1;padding:12px 8px;overflow-y:auto;overflow-x:hidden}
.sb-item{
  display:flex;align-items:center;gap:10px;padding:10px 10px;
  border-radius:8px;text-decoration:none;
  color:rgba(255,255,255,.5);font-size:14px;font-weight:500;
  transition:background .15s,color .15s;margin-bottom:2px;
  position:relative;white-space:nowrap;
}
.sb-item:hover{background:rgba(255,255,255,.06);color:rgba(255,255,255,.85)}
.sb-item--active{color:#fff;font-weight:600;background:rgba(255,255,255,.08)}
.sb-item--active .sb-ico{color:#fff}
.sb-item-indicator{
  position:absolute;left:0;top:50%;transform:translateY(-50%);
  width:3px;height:56%;border-radius:0 2px 2px 0;
  background:var(--red);
}
.sb-ico{flex-shrink:0;width:18px;height:18px;display:flex;align-items:center}
.sb-lbl{flex:1}

.sb-bottom{flex-shrink:0;padding:8px}
.sb-divider{height:1px;background:rgba(255,255,255,.07);margin:0 4px 10px}
.sb-admin{display:flex;align-items:center;gap:8px;padding:8px;border-radius:8px;background:rgba(255,255,255,.05);margin-bottom:6px}
.sb-admin--slim{justify-content:center}
.sb-admin-av{
  width:32px;height:32px;border-radius:8px;flex-shrink:0;
  background:linear-gradient(135deg,#2d4a7a,#1a2540);
  color:#fff;font-family:'Barlow Condensed',sans-serif;
  font-size:13px;font-weight:800;display:flex;align-items:center;justify-content:center;
  border:1px solid rgba(255,255,255,.15);
}
.sb-admin-info{flex:1;overflow:hidden}
.sb-admin-name{display:block;color:#fff;font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sb-admin-email{display:block;color:rgba(255,255,255,.3);font-size:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sb-toggle{
  display:flex;align-items:center;justify-content:center;
  width:100%;padding:6px;background:none;border:none;cursor:pointer;
  color:rgba(255,255,255,.2);border-radius:6px;transition:background .15s,color .15s;
}
.sb-toggle:hover{background:rgba(255,255,255,.06);color:rgba(255,255,255,.5)}

/* ══ MAIN ══ */
.main{flex:1;display:flex;flex-direction:column;min-width:0}

/* TOPBAR */
.topbar{
  height:58px;background:var(--surface);
  border-bottom:1px solid var(--border);
  display:flex;align-items:center;justify-content:space-between;
  padding:0 22px;position:sticky;top:0;z-index:100;flex-shrink:0;
  box-shadow:var(--shadow-sm);
}
.tb-search-wrap{
  display:flex;align-items:center;gap:9px;
  background:var(--bg);border:1px solid var(--border);
  border-radius:8px;padding:8px 14px;
  width:320px;color:var(--text3);
}
.tb-search{
  flex:1;border:none;outline:none;background:none;
  font-size:14px;font-family:'Barlow',sans-serif;color:var(--text);
}
.tb-search::placeholder{color:var(--text3)}
.tb-right{display:flex;align-items:center;gap:10px;margin-left:auto}

.tb-bell{
  width:36px;height:36px;border-radius:8px;
  background:var(--bg);border:1px solid var(--border);
  display:flex;align-items:center;justify-content:center;
  cursor:pointer;color:var(--text2);position:relative;
  transition:background .15s;
}
.tb-bell:hover{background:var(--surface)}
.tb-bell-badge{
  position:absolute;top:-4px;right:-4px;
  width:16px;height:16px;border-radius:50%;
  background:var(--red);color:#fff;font-size:9px;font-weight:700;
  display:flex;align-items:center;justify-content:center;
  border:2px solid var(--surface);
}

.profile-wrap{position:relative}
.profile-chip{
  display:flex;align-items:center;gap:8px;
  background:var(--bg);border:1px solid var(--border);
  border-radius:8px;padding:5px 10px 5px 6px;
  cursor:pointer;transition:background .15s;color:var(--text);
}
.profile-chip:hover{background:var(--surface)}
.pc-av{
  width:28px;height:28px;border-radius:6px;
  background:var(--navy);color:#fff;
  font-family:'Barlow Condensed',sans-serif;font-size:12px;font-weight:800;
  display:flex;align-items:center;justify-content:center;
}
.pc-name{font-size:13px;font-weight:600;color:var(--text);white-space:nowrap}
.pc-chevron{color:var(--text3);transition:transform .2s;flex-shrink:0}
.pc-chevron--up{transform:rotate(180deg)}

/* Dropdown */
.profile-drop{
  position:absolute;top:calc(100% + 6px);right:0;width:260px;
  background:var(--surface);border:1px solid var(--border);
  border-radius:12px;box-shadow:var(--shadow-md);overflow:hidden;z-index:200;
}
.pd-head{padding:14px;display:flex;align-items:center;gap:11px;background:var(--navy)}
.pd-av{
  width:40px;height:40px;border-radius:9px;flex-shrink:0;
  background:rgba(255,255,255,.12);color:#fff;
  font-family:'Barlow Condensed',sans-serif;font-size:15px;font-weight:800;
  display:flex;align-items:center;justify-content:center;
}
.pd-name{color:#fff;font-size:13px;font-weight:700;margin:0 0 2px}
.pd-email{color:rgba(255,255,255,.45);font-size:11px;margin:0 0 5px}
.pd-badge{
  display:inline-block;background:rgba(230,61,47,.25);
  border:1px solid rgba(230,61,47,.4);
  color:#ff8f86;font-family:'Barlow Condensed',sans-serif;
  font-size:9px;font-weight:700;padding:2px 8px;border-radius:3px;letter-spacing:.8px;
}
.pd-sep{height:1px;background:var(--border)}
.pd-menu{padding:6px}
.pd-item{
  width:100%;display:flex;align-items:center;gap:9px;padding:9px 11px;
  border-radius:7px;background:none;border:none;cursor:pointer;
  font-size:13px;font-weight:500;color:var(--text);font-family:'Barlow',sans-serif;
  transition:background .15s;text-align:left;
}
.pd-item:hover{background:var(--bg)}
.pd-logout{color:#e63d2f;padding:9px 11px 11px}
.pd-logout:hover{background:rgba(230,61,47,.07)}

.content{flex:1;padding:24px;overflow-y:auto;background:var(--bg)}

/* Transitions */
.page-enter-active,.page-leave-active{transition:opacity .18s,transform .18s}
.page-enter-from{opacity:0;transform:translateY(6px)}
.page-leave-to{opacity:0;transform:translateY(-6px)}
.lbl-enter-active,.lbl-leave-active{transition:opacity .18s;overflow:hidden}
.lbl-enter-from,.lbl-leave-to{opacity:0}
.drop-enter-active{animation:dropIn .2s cubic-bezier(.22,1,.36,1)}
.drop-leave-active{animation:dropIn .15s reverse}
@keyframes dropIn{from{opacity:0;transform:translateY(-8px)scale(.97)}to{opacity:1;transform:translateY(0)scale(1)}}

/* ── Notifications dropdown ── */
.notif-wrap{position:relative}
.notif-drop{
  position:absolute;top:calc(100% + 8px);right:0;width:320px;
  background:var(--surface);border:1px solid var(--border);
  border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,.14);z-index:300;
  overflow:hidden;
}
.notif-drop-head{
  display:flex;align-items:center;justify-content:space-between;
  padding:13px 16px;border-bottom:1px solid var(--border);
  font-family:'Barlow Condensed',sans-serif;font-size:12px;font-weight:800;
  letter-spacing:.8px;color:var(--text);background:#fafbfc;
}
.notif-count{
  font-family:'Barlow Condensed',sans-serif;font-size:11px;font-weight:800;
  background:var(--navy);color:#fff;border-radius:99px;padding:2px 9px;
  letter-spacing:.5px;transition:background .3s;
}
.nc-zero{background:#d4d9e3;color:#8895a7}
.notif-list{list-style:none;margin:0;padding:0;max-height:280px;overflow-y:auto}
.notif-list::-webkit-scrollbar{width:3px}
.notif-list::-webkit-scrollbar-thumb{background:#e4e7ed;border-radius:99px}
.notif-item{
  display:flex;align-items:center;gap:11px;
  padding:11px 16px;border-bottom:1px solid var(--border);
  cursor:pointer;transition:background .12s;position:relative;
}
.notif-item:last-child{border-bottom:none}
.notif-item:hover{background:#f8f9fc}
.notif-empty{padding:28px 16px;text-align:center;color:var(--text3);font-size:13px}
.notif-empty p{margin:0}
.notif-icon{
  width:30px;height:30px;border-radius:8px;flex-shrink:0;
  display:flex;align-items:center;justify-content:center;
}
.ni-ok   {background:#f0fdf4;color:#166534}
.ni-doc  {background:#fffbeb;color:#92400e}
.ni-user {background:#eff6ff;color:#1d4ed8}
.ni-alert{background:#fff5f5;color:#e63d2f}
.notif-body{flex:1;min-width:0}
.notif-text{
  font-size:13px;color:var(--text);margin:0 0 2px;
  line-height:1.35;font-weight:600;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
}
.notif-time{font-size:11px;color:var(--text3);margin:0;font-weight:500}
.notif-unread-dot{
  width:7px;height:7px;border-radius:50%;
  background:#3b82f6;flex-shrink:0;
  box-shadow:0 0 0 2px #fff;
}

/* ── Hamburger (solo móvil) ── */
.tb-hamburger{display:none;align-items:center;justify-content:center;background:none;border:none;color:var(--text2);cursor:pointer;padding:6px;border-radius:6px;transition:background .15s}
.tb-hamburger:hover{background:var(--surface)}

/* ── Sidebar overlay (fondo oscuro en móvil) ── */
.sidebar-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:199;pointer-events:none}

/* ── Media query móvil ── */
@media(max-width:768px){
  .sidebar{position:fixed;left:0;top:0;bottom:0;height:100%;z-index:201;transform:translateX(-100%);transition:transform .3s ease;width:240px !important}
  .sidebar--mobile-open{transform:translateX(0) !important}
  .sidebar-overlay--on{display:block;pointer-events:auto}
  .main{margin-left:0 !important}
  .tb-hamburger{display:flex}
  .sb-toggle{display:none}
}
</style>