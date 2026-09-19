<template>

  <!-- ══════════════════════════════════
       PRELOADER
  ══════════════════════════════════ -->
  <div v-if="stage === 'preloader'" class="pl-shell" :class="{ ready: plReady }">

    <div class="pl-logo-wrap">
      <img :src="logoImg" alt="Logo" class="pl-logo" />
    </div>

    <div class="pl-title-wrap">
      <h1 class="pl-title">REVISIÓN<br/>PREOPERACIONAL</h1>
      <div class="pl-accent"></div>
    </div>

    <div class="pl-progress-area">
      <div class="pl-track">
        <div class="pl-fill" :style="{ width: plPct + '%' }"></div>
      </div>
      <div class="pl-status">
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
          <path d="M6.5 1L12 4.5V9C12 11.2 9.6 13 6.5 13C3.4 13 1 11.2 1 9V4.5L6.5 1Z"
            stroke="#8892a4" stroke-width="1.1" stroke-linejoin="round"/>
          <path d="M4.5 6.5l1.5 1.5 3-3" stroke="#8892a4" stroke-width="1.1"
            stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span class="pl-msg">{{ plMsg }}</span>
      </div>
    </div>

    <div class="pl-footer">
      <span>SISTEMA V4.0.2</span>
    </div>
  </div>

  <!-- ══════════════════════════════════
       LOGIN SCREEN
  ══════════════════════════════════ -->
  <div v-else class="login-shell">

    <!-- Topbar -->
    <div class="login-topbar">
      <div class="ltb-brand">
        <img :src="logoImg" alt="Logo" class="ltb-logo" />
        <span class="ltb-text">PREOPERACIONAL</span>
      </div>
    </div>

    <!-- Hero (logo en caja oscura) -->
    <div class="login-hero">
      <div class="hero-wrap">
        <img :src="logoImg" alt="Revisión" class="hero-img" />
      </div>
    </div>

    <!-- Tarjeta de login -->
    <div class="login-card">
      <h1 class="lc-title">Revisión Preoperacional</h1>
      <p class="lc-sub">Acceso seguro al sistema de inspección</p>

      <!-- Error -->
      <Transition name="err-t">
        <div v-if="errorMsg" class="lc-error" role="alert">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="6" stroke="currentColor" stroke-width="1.2"/>
            <path d="M7 4.5V7.5M7 9.5v.3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
          </svg>
          {{ errorMsg }}
        </div>
      </Transition>

      <!-- Email -->
      <div class="lc-field">
        <label class="lc-label">CORREO ELECTRÓNICO</label>
        <div class="lc-row" :class="{ err: vEmail === false }">
          <svg class="lc-ico" width="17" height="17" viewBox="0 0 17 17" fill="none">
            <rect x="1.5" y="4" width="14" height="9.5" rx="1.5" stroke="currentColor" stroke-width="1.2"/>
            <path d="M1.5 6.5L8.5 10.5L15.5 6.5" stroke="currentColor" stroke-width="1.2"/>
          </svg>
          <input
            v-model.trim="email"
            type="email" inputmode="email"
            placeholder="usuario@empresa.com"
            autocomplete="username"
            class="lc-input"
            @blur="validateEmail"
            @input="vEmail=null; errorMsg=''"
            @keyup.enter="tryLogin"
          />
        </div>
      </div>

      <!-- Contraseña -->
      <div class="lc-field">
        <label class="lc-label">CONTRASEÑA</label>
        <div class="lc-row" :class="{ err: vPass === false }">
          <svg class="lc-ico" width="17" height="17" viewBox="0 0 17 17" fill="none">
            <rect x="2.5" y="7.5" width="12" height="8.5" rx="1.5" stroke="currentColor" stroke-width="1.2"/>
            <path d="M5.5 7.5V5.5a3 3 0 0 1 6 0v2" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
            <circle cx="8.5" cy="11.5" r="1.2" fill="currentColor"/>
          </svg>
          <input
            v-model="password"
            :type="showPwd ? 'text' : 'password'"
            placeholder="••••••••••"
            autocomplete="current-password"
            class="lc-input"
            @blur="validatePass"
            @input="vPass=null; errorMsg=''"
            @keyup.enter="tryLogin"
          />
          <button type="button" class="lc-eye" @click="showPwd=!showPwd" tabindex="-1"
            :title="showPwd ? 'Ocultar contraseña' : 'Mostrar contraseña'">
            <svg v-if="!showPwd" width="18" height="18" viewBox="0 0 18 18" fill="none">
              <ellipse cx="9" cy="9" rx="7" ry="4.5" stroke="currentColor" stroke-width="1.2"/>
              <circle cx="9" cy="9" r="2" stroke="currentColor" stroke-width="1.2"/>
            </svg>
            <svg v-else width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M1 1l16 16M6.5 6.7A2.5 2.5 0 0 0 11.3 11.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
              <path d="M4 4.5C2.5 5.7 1.5 7.3 1 9c1.2 3.5 4.7 6 8 6 1.4 0 2.7-.4 3.8-1M9 3c3.3 0 6.8 2.5 8 6-.4 1.3-1.1 2.5-2.1 3.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Botón iniciar sesión -->
      <button
        class="lc-btn"
        :disabled="loading"
        type="button"
        @click="tryLogin"
        title="Iniciar sesión en el sistema"
      >
        <template v-if="!loading">
          <span>INICIAR SESIÓN</span>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.8"
              stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </template>
        <span v-else class="btn-dots">
          <span></span><span></span><span></span>
        </span>
      </button>

      <!-- Olvidé mi contraseña -->
      <button type="button" class="lc-forgot" @click="router.push('/restablecer')">
        ¿Olvidaste tu contraseña?
      </button>

    </div>

    <!-- Footer de seguridad -->
    <div class="login-footer">
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
        <path d="M6.5 1L11.5 4V7.5C11.5 10 9.3 12 6.5 13C3.7 12 1.5 10 1.5 7.5V4L6.5 1Z"
          stroke="#8892a4" stroke-width="1.1" stroke-linejoin="round"/>
        <path d="M4.5 6.5l1.5 1.5 3-3" stroke="#8892a4" stroke-width="1.1"
          stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <span>PROTOCOLO DE SEGURIDAD ENCRIPTADO</span>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import logoImg from '../assets/Logo.png'

type Stage = 'preloader' | 'login'

const router = useRouter()
const route  = useRoute()
const auth   = useAuthStore()

const skipPreloader = route.query.from === 'logout' || route.query.from === 'not_driver'
const initialStage: Stage = skipPreloader ? 'login' : 'preloader'

const stage   = ref<Stage>(initialStage)
const plReady = ref(false)
const plPct   = ref(0)
const plMsg   = ref('INICIALIZANDO SISTEMA...')

/* ── Preloader ───────────────────────────────────────── */
function startPreloader() {
  setTimeout(() => { plReady.value = true }, 80)
  const steps = [
    { p: 20,  m: 'VERIFICANDO MÓDULOS DE SEGURIDAD...'  },
    { p: 45,  m: 'AUTENTICANDO TERMINAL DE SEGURIDAD'   },
    { p: 70,  m: 'SINCRONIZANDO BASE DE DATOS...'       },
    { p: 90,  m: 'CARGANDO CONFIGURACIÓN...'            },
    { p: 100, m: 'SISTEMA LISTO'                        },
  ]
  let i = 0
  function tick() {
    if (i >= steps.length) {
      setTimeout(() => { stage.value = 'login' }, 700)
      return
    }
    plPct.value = steps[i].p
    plMsg.value = steps[i].m
    i++
    setTimeout(tick, 480)
  }
  setTimeout(tick, 300)
}

onMounted(() => {
  // Si el router nos devolvió al login porque un ADMIN intentó usar la app
  if (route.query.from === 'not_driver') {
    errorMsg.value = 'Los administradores no pueden acceder a la app de conductores. Usa el panel web.'
  }

  if (stage.value === 'preloader' && !skipPreloader) {
    startPreloader()
  }
})

/* ── Login ─────────────────────────────────────────────── */
const email    = ref('')
const password = ref('')
const loading  = ref(false)
const errorMsg = ref('')
const showPwd  = ref(false)
const vEmail   = ref<boolean | null>(null)
const vPass    = ref<boolean | null>(null)

function validateEmail(): boolean {
  const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)
  vEmail.value = email.value.length > 0 ? ok : null
  return ok
}
function validatePass(): boolean {
  const ok = password.value.length >= 6
  vPass.value = password.value.length > 0 ? ok : null
  return ok
}

async function tryLogin() {
  errorMsg.value = ''
  if (!validateEmail() || !validatePass()) return
  loading.value = true
  try {
    await auth.login(email.value, password.value)

    // Solo CONDUCTOR puede acceder a la app de conductores
    if (!auth.isDriver) {
      auth.logout()
      errorMsg.value = 'Esta aplicación es solo para conductores. Los administradores deben usar el panel web.'
      vPass.value = null
      return
    }

    // Contraseña temporal asignada por un admin → forzar cambio antes de continuar
    if (auth.mustChangePassword) {
      router.push('/cambiar-clave?forzado=1')
      return
    }

    router.push('/inspeccionar')
  } catch (err: any) {
    const s = err?.response?.status
    errorMsg.value =
      s === 401 ? 'Credenciales incorrectas. Correo o contraseña.'
    : s === 403 ? 'Tu cuenta está inactiva. Contacta al administrador.'
    : 'Error de conexión. Intenta de nuevo.'
    password.value = ''
    vPass.value    = null
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&family=Barlow+Condensed:wght@700;800;900&display=swap');

/* ── PRELOADER ───────────────────────────────── */
.pl-shell {
  min-height: 100dvh;
  background: var(--bg-solid);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 24px;
  font-family: 'Barlow Condensed', sans-serif;
  opacity: 0;
  transition: opacity .35s ease;
}
.pl-shell.ready { opacity: 1; }

.pl-logo-wrap {
  margin-bottom: 32px;
}
.pl-logo {
  width: clamp(180px, 50vw, 280px);
  height: clamp(180px, 50vw, 280px);
  object-fit: contain;
}

.pl-title-wrap { text-align: center; margin-bottom: 52px; }
.pl-title {
  font-size: clamp(24px, 7vw, 34px); font-weight: 900; color: var(--text-strong);
  line-height: 1.05; letter-spacing: 1px; margin: 0 0 14px;
}
.pl-accent { width: 72px; height: 3px; background: #e8612c; border-radius: 2px; margin: 0 auto; }

.pl-progress-area { width: 100%; max-width: 320px; }
.pl-track {
  height: 3px; background: rgba(26,37,64,.12);
  border-radius: 2px; overflow: hidden; margin-bottom: 16px;
}
.pl-fill {
  height: 100%; background: var(--accent-bg);
  border-radius: 2px; transition: width .45s ease;
}
.pl-status {
  display: flex; align-items: center; gap: 8px;
  justify-content: center;
  font-size: 11px; font-weight: 700; letter-spacing: 1.2px; color: var(--muted);
}
.pl-msg { text-align: center; }

.pl-footer {
  position: fixed; bottom: 0; left: 0; right: 0;
  padding: 14px 20px calc(14px + env(safe-area-inset-bottom));
  display: flex; justify-content: space-between;
  font-size: 9px; font-weight: 700; letter-spacing: .8px; color: var(--muted);
}

/* ── LOGIN ───────────────────────────────────── */
.login-shell {
  min-height: 100dvh;
  background: var(--bg-solid);
  display: flex; flex-direction: column;
  font-family: 'Barlow', sans-serif;
  max-width: 560px; margin: 0 auto;
}
.login-topbar {
  padding: calc(env(safe-area-inset-top) + 16px) 22px 0;
}
.ltb-brand { display: flex; align-items: center; gap: 8px; }
.ltb-logo { width: 33px; height: 33px; object-fit: contain; border-radius: 5px; }
.ltb-text {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 15px; font-weight: 900; color: var(--text); letter-spacing: 2px;
}

.login-hero { display: flex; justify-content: center; padding: 48px 24px 0; }
/*.hero-wrap {
  width: 210px; height: 210px; background: var(--dark); border-radius: 14px;
  overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,.28);
  display: flex; align-items: center; justify-content: center;
}*/
.hero-img { 
  width: clamp(160px, 45vw, 220px);
  height: clamp(150px, 42vw, 210px); 
  object-fit: contain; 
}

.login-card {
  background: var(--surface); border-radius: 20px 20px 0 0;
  margin-top: 30px; flex: 1;
  padding: 24px 24px calc(24px + env(safe-area-inset-bottom));
  box-shadow: 0 -4px 30px var(--shadow);
}
.lc-title {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: clamp(22px, 6vw, 28px); font-weight: 900; color: var(--text);
  line-height: 1.05; margin: 0 0 6px;
  text-align: center; word-break: keep-all;
}
.lc-sub { font-size: 14px; color: var(--muted); margin: 0 0 26px; text-align: center; }

.lc-error {
  display: flex; align-items: center; gap: 8px;
  background: var(--alert-error-bg); border: 1px solid var(--alert-error-border); border-radius: 8px;
  padding: 10px 13px; font-size: 13px; color: var(--alert-error-text); font-weight: 450;
  margin-bottom: 20px;
  overflow: hidden;
  max-height: 80px;
}
.err-t-enter-active { animation: errIn .2s ease; }
.err-t-leave-active { animation: errIn .15s reverse; }
@keyframes errIn { from{opacity:0;transform:translateY(-5px)} to{opacity:1;transform:translateY(0)} }

.lc-field { margin-bottom: 22px; }
.lc-label {
  display: block; font-family: 'Barlow Condensed', sans-serif;
  font-size: 11px; font-weight: 700; letter-spacing: 1.4px; color: var(--muted); margin-bottom: 10px;
}
.lc-row {
  display: flex; align-items: center; gap: 10px;
  border-bottom: 1.5px solid var(--border); padding: 8px 4px;
  color: var(--muted); transition: border-color .2s, color .2s;
}
.lc-row:focus-within { border-color: var(--text); color: var(--text); }
.lc-row.err { border-color: var(--red); }
.lc-ico { flex-shrink: 0; }
.lc-input {
  flex: 1; border: none; outline: none; background: none;
  font-size: 16px; font-family: 'Barlow', sans-serif; color: var(--text); min-width: 0;
}
.lc-input::placeholder { color: var(--muted); }
.lc-eye {
  background: none; border: none; cursor: pointer; color: var(--muted);
  padding: 2px; display: flex; transition: color .15s; flex-shrink: 0;
}
.lc-eye:hover { color: var(--text); }

.lc-btn {
  width: 100%; padding: 14px 20px;
  background: var(--accent-bg); color: var(--accent-text); border: none; border-radius: 8px;
  font-family: 'Barlow Condensed', sans-serif;
  font-size: clamp(14px, 3.8vw, 16px); font-weight: 800; letter-spacing: 2px; cursor: pointer;
  display: flex; align-items: center; justify-content: center; gap: 10px;
  margin-top: 24px; margin-bottom: 16px;
  transition: background .15s, transform .1s;
  box-shadow: 0 4px 20px var(--shadow);
}
.lc-btn:hover:not(:disabled) { background: var(--accent-bg-hover); transform: translateY(-1px); }
.lc-btn:active:not(:disabled) { transform: translateY(0); }
.lc-btn:disabled { opacity: .65; cursor: not-allowed; }

.lc-forgot {
  display: flex; align-items: center; justify-content: center; gap: 6px;
  width: 100%; margin: 2px 0 6px;
  background: none; border: none; cursor: pointer;
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 13px; font-weight: 700; letter-spacing: 1px; color: var(--muted);
  padding: 8px; transition: color .15s;
}
.lc-forgot:hover { color: var(--text); text-decoration: underline; text-underline-offset: 2px; }

.btn-dots { display: flex; gap: 5px; align-items: center; }
.btn-dots span {
  width: 7px; height: 7px; border-radius: 50%;
  background: rgba(255,255,255,.8); animation: bd .8s infinite;
}
.btn-dots span:nth-child(2){animation-delay:.14s}.btn-dots span:nth-child(3){animation-delay:.28s}
@keyframes bd{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-7px)}}

.lc-reconfig {
  display: flex; align-items: center; justify-content: center; gap: 6px;
  width: 100%; margin-top: 10px;
  background: none; border: none; cursor: pointer;
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 12px; font-weight: 700; letter-spacing: 1px; color: var(--muted);
  padding: 8px; transition: color .15s;
}
.lc-reconfig:hover { color: var(--text); }

.login-footer {
  display: flex; align-items: center; justify-content: center; gap: 7px;
  padding: 14px; font-family: 'Barlow Condensed', sans-serif;
  font-size: 10px; font-weight: 700; letter-spacing: 1px; color: var(--muted);
}
</style>
