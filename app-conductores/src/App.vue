<template>
  <div class="shell">
    <router-view />

    <!-- Bottom nav — 4 tabs -->
    <nav v-if="showNav" class="bottom-nav">
      <template v-for="tab in tabs" :key="tab.to">

        <router-link
          v-if="tab.label !== 'Salir'"
          :to="tab.to"
          class="bn-tab"
          :class="{ active: route.path.startsWith(tab.to) }"
        >
          <div class="bn-icon" v-html="tab.icon"></div>
          <span class="bn-label">{{ tab.label }}</span>
        </router-link>

        <button
          v-else
          class="bn-tab bn-salir"
          type="button"
          @click="doLogout"
        >
          <div class="bn-icon" v-html="tab.icon"></div>
          <span class="bn-label">{{ tab.label }}</span>
        </button>

      </template>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from './stores/auth'

const route  = useRoute()
const router = useRouter()
const auth   = useAuthStore()

const showNav = computed(() =>
  auth.isLoggedIn && route.path !== '/login'
)

function doLogout() {
  auth.logout()
  router.replace('/login?from=logout')
}

const tabs = [
  {
    to: '/inspeccionar',
    label: 'Inspeccionar',
    icon: `<svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <rect x="3" y="2" width="13" height="18" rx="2" stroke="currentColor" stroke-width="1.6"/>
      <path d="M6 7h7M6 11h7M6 15h4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
      <circle cx="17" cy="16" r="4.5" fill="currentColor" stroke="var(--nav-bg)" stroke-width="1.2"/>
      <path d="M15 16l1.3 1.5L19 14" stroke="var(--nav-bg)" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
  },
  {
    to: '/historial',
    label: 'Historial',
    icon: `<svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <circle cx="11" cy="11" r="8.5" stroke="currentColor" stroke-width="1.6"/>
      <path d="M11 7v4.5l3 2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
  },
  {
    to: '/perfil',
    label: 'Perfil',
    icon: `<svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <circle cx="11" cy="7.5" r="3.5" stroke="currentColor" stroke-width="1.6"/>
      <path d="M3 19c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
    </svg>`,
  },
  {
    to: '/login',
    label: 'Salir',
    icon: `<svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path d="M9 19H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
      <path d="M15 15l4-4-4-4M9 11h10" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
  },
]
</script>

<style>


*, *::before, *::after { box-sizing: border-box; }
html, body, #app { margin: 0; padding: 0; min-height: 100%; font-family: 'Barlow', sans-serif; }
/* Fondo rellena zona del notch (status bar) en Android edgeToEdge e iOS black-translucent */
html { background-color: var(--bg-solid); }
body { background-color: var(--bg-solid); }

/* ── Android WebView: prevenir auto-zoom y layout rot ── */
html, body {
  background: var(--bg-solid-2);
}
html {
  touch-action: manipulation;
  -webkit-text-size-adjust: 100%;
  -ms-text-size-adjust: 100%;
  text-size-adjust: 100%;
}
body {
  -webkit-overflow-scrolling: touch;
}
#app {
  min-height: 100vh;
  min-height: 100dvh;
}
input, textarea, select {
  font-size: 16px !important;
  -webkit-appearance: none;
  -webkit-border-radius: 0;
  border-radius: 0;
}
input:focus, textarea:focus, select:focus {
  font-size: 16px !important;
  outline: none;
}

:root {
  --navy:    #1a2540;
  --dark:    #0d1422;
  --red:     #e63d2f;
  --orange:  #f05a28;
  --green:   #27ae60;

  /* Superficie de marca (headers/avatares/botones principal) */
  --accent-bg:   #1a2540;
  --accent-text: #ffffff;
  --accent-bg-hover: #0d1422;

  /* Tema claro (default) */
  --bg:          #edf0f5;
  --bg-solid:    #f3f4f6;
  --bg-solid-2:  #f2f3f4;
  --surface:     #ffffff;
  --surface-2:   #f8fafc;
  --surface-3:   #f1f5f9;
  --topbar-bg:   #ffffff;
  --topbar-border: #dde2ec;
  --text:        #1a2540;
  --text-strong: #0d1422;
  --muted:       #8892a4;
  --border:      #d0d8e8;
  --border-soft: #e8ecf2;
  --input-bg:    #f8fafc;
  --nav-bg:      #0d1422;
  --shadow:      rgba(26,37,64,.15);
  --overlay:     rgba(13,20,34,.4);

  /* Badges / estados (claro) */
  --badge-ok-bg:   #f0f8f4;
  --badge-ok-text: #1a7a3e;
  --badge-bad-bg:  #fdf3f3;
  --badge-bad-text:#c0392b;
  --badge-obs-bg:  #fffbeb;
  --badge-obs-text:#b45309;
  --badge-vac-bg:  #fff3e0;
  --badge-vac-text:#b45309;
  --badge-gray-bg: #f1f5f9;
  --badge-gray-text:#6b7280;
  --badge-blue-bg: #eff6ff;
  --badge-blue-text:#1a2540;

  --alert-error-bg:   #fff5f5;
  --alert-error-border:#fecaca;
  --alert-error-text: #dc2626;
  --alert-ok-bg:      #f0f8f4;
  --alert-ok-border:  #c9ecd7;
  --alert-warn-bg:    #fffbeb;
  --alert-warn-border:#fde68a;
  --alert-warn-text:  #92400e;

  --done-bg:     #ffffff;
  --sheet-bg:    #ffffff;
  --qi-bg:       #dff4f7;
  --option-hover:#f0f4ff;
  --option-hover-text:#1a2540;
  --option-selected:#eef2ff;
  --option-selected-text:#1a2540;
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg:          #0d1422;
    --bg-solid:    #111827;
    --bg-solid-2:  #0d1422;
    --surface:     #1a2540;
    --surface-2:   #1e293b;
    --surface-3:   #22304c;
    --topbar-bg:   #0d1422;
    --topbar-border: #2a3a5c;
    --text:        #e8ecf2;
    --text-strong: #ffffff;
    --muted:       #9aa5c1;
    --border:      #2a3a5c;
    --border-soft: #24324f;
    --input-bg:    #22304c;
    --nav-bg:      #0a0f1a;
    --shadow:      rgba(0,0,0,.4);
    --overlay:     rgba(0,0,0,.55);

    --badge-ok-bg:   #123524;
    --badge-ok-text: #4ade80;
    --badge-bad-bg:  #3b1512;
    --badge-bad-text:#f87171;
    --badge-obs-bg:  #3a2a12;
    --badge-obs-text:#fbbf24;
    --badge-vac-bg:  #3a2a12;
    --badge-vac-text:#fbbf24;
    --badge-gray-bg: #22304c;
    --badge-gray-text:#9aa5c1;
    --badge-blue-bg: #16233f;
    --badge-blue-text:#93a8e0;

    --alert-error-bg:   #3a1616;
    --alert-error-border:#7f1d1d;
    --alert-error-text: #fca5a5;
    --alert-ok-bg:      #123524;
    --alert-ok-border:  #14603c;
    --alert-warn-bg:    #3a2a12;
    --alert-warn-border:#8a670e;
    --alert-warn-text:  #fcd34d;

    --done-bg:     #1a2540;
    --sheet-bg:    #1a2540;
    --qi-bg:       #1e3a4a;
    --option-hover:#223e6b;
    --option-hover-text:#ffffff;
    --option-selected:#24406e;
    --option-selected-text:#ffffff;
  }
}
</style>

<style scoped>
.shell {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  background: var(--bg);
  padding-bottom: env(safe-area-inset-bottom);
}

.bottom-nav {
  position: fixed;
  bottom: 0; left: 0; right: 0;
  background: var(--nav-bg);
  display: flex;
  max-width: 560px;
  margin: 0 auto;
  padding: 8px 4px calc(8px + env(safe-area-inset-bottom));
  border-top: 1px solid rgba(255,255,255,.06);
  z-index: 100;
}

.bn-tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 4px;
  text-decoration: none;
  color: rgba(255,255,255,.35);
  border: none;
  background: none;
  cursor: pointer;
  transition: color .15s;
}
.bn-tab.active { color: var(--red); }
.bn-salir { color: rgba(255,255,255,.3); }
.bn-salir:hover { color: #ff6b6b; }

.bn-icon  { display: flex; align-items: center; justify-content: center; width: 22px; height: 22px; }
.bn-label { font-size: 10px; font-weight: 600; letter-spacing: .3px; }
</style>
