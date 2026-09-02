<template>
  <div class="login-root">

    <!-- ══ LEFT — dark panel with headline ══ -->
    <div class="login-left">
      <div class="ll-overlay"></div>

      <!-- Circular logo top-left -->
      <div class="ll-logo-wrap">
        <img :src="logoSrc" alt="Logo" class="ll-logo-img" />
      </div>

      <!-- Hero text bottom-left -->
      <div class="ll-hero">
        <p class="ll-eyebrow">MISIÓN DE SEGURIDAD</p>
        <h2 class="ll-headline">Garantizamos que cada vehículo en la vía cumpla con los más altos estándares de seguridad.</h2>
        <p class="ll-desc">La revisión preoperacional es el primer paso para proteger vidas.</p>
      </div>

      <div class="ll-footer">EST. 2026 / INSPECCION PREOPERACIONAL</div>
    </div>

    <!-- ══ RIGHT — login form ══ -->
    <div class="login-right">
      <div class="lr-wrap">

        <div class="lr-header">
          <h1 class="lr-title">Acceso Administrativo</h1>
          <p class="lr-sub">Bienvenido al sistema de control de preoperacional</p>
        </div>

        <!-- Success alert -->
        <Transition name="err-t">
          <div v-if="okMsg" class="lr-ok" role="status" aria-live="polite">
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="7.5" r="6.5" fill="#22c55e"/><path d="M4.6 7.6l2 2.2 4-4.6" stroke="#fff" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
            {{ okMsg }}
          </div>
        </Transition>

        <!-- Error alert -->
        <Transition name="err-t">
          <div v-if="errorMsg" class="lr-error" role="alert" aria-live="polite">
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="7.5" r="6.5" stroke="currentColor" stroke-width="1.3"/><path d="M7.5 4.5v3.5M7.5 10.5v.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
            {{ errorMsg }}
          </div>
        </Transition>

        <!-- Email -->
        <div class="lr-fb">
          <label class="lr-label" for="lr-email">CORREO ELECTRÓNICO</label>
          <div class="lr-field" :class="{'lr-focus':fEmail,'lr-err-f':vEmail===false,'lr-ok-f':vEmail===true}">
            <svg class="lr-ico" width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="1.5" y="3.5" width="15" height="11" rx="2" stroke="currentColor" stroke-width="1.4"/><path d="M1.5 7L9 11.5L16.5 7" stroke="currentColor" stroke-width="1.4"/></svg>
            <input
              id="lr-email"
              v-model.trim="email"
              type="email" inputmode="email" autocomplete="email"
              placeholder="nombre@empresa.com"
              :disabled="loading"
              @focus="fEmail=true" @blur="fEmail=false; validateEmail()"
              @keyup.enter="tryLogin"
              aria-label="Correo electrónico"
            />
            <svg v-if="vEmail===true" class="lr-chk" width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" fill="#22c55e"/><path d="M5 8l2.3 2.5L11 5.5" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
          <p v-if="vEmail===false" class="lr-ferr">Ingresa un correo electrónico válido</p>
        </div>

        <!-- Password -->
        <div class="lr-fb">
          <label class="lr-label" for="lr-pass">CONTRASEÑA</label>
          <div class="lr-field" :class="{'lr-focus':fPass,'lr-err-f':vPass===false,'lr-ok-f':vPass===true}">
            <svg class="lr-ico" width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2.5" y="8" width="13" height="9" rx="2" stroke="currentColor" stroke-width="1.4"/><path d="M5.5 8V6a3.5 3.5 0 0 1 7 0v2" stroke="currentColor" stroke-width="1.4"/><circle cx="9" cy="12.5" r="1.5" fill="currentColor"/></svg>
            <input
              id="lr-pass"
              v-model="password"
              :type="showPwd?'text':'password'"
              autocomplete="current-password"
              placeholder="••••••••••"
              :disabled="loading"
              @focus="fPass=true" @blur="fPass=false; validatePass()"
              @keyup.enter="tryLogin"
              aria-label="Contraseña"
            />
            <button type="button" class="lr-eye" @click="showPwd=!showPwd" tabindex="-1" :aria-label="showPwd?'Ocultar':'Mostrar'">
              <svg v-if="!showPwd" width="18" height="18" viewBox="0 0 18 18" fill="none"><ellipse cx="9" cy="9" rx="7" ry="4.5" stroke="currentColor" stroke-width="1.4"/><circle cx="9" cy="9" r="2.3" stroke="currentColor" stroke-width="1.4"/></svg>
              <svg v-else width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2 2L16 16M7 7.3A2.5 2.5 0 0 0 10.7 11M4 4.2C2.5 5.5 1.6 7 1.5 9c1 3.4 4 5.5 7.5 5.5 1.4 0 2.7-.4 3.8-1M6 3.5C7 3.2 8 3 9 3c3.5 0 6.5 2.1 7.5 5.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
            </button>
          </div>
          <p v-if="vPass===false" class="lr-ferr">Mínimo 6 caracteres requeridos</p>
        </div>

        <!-- Forgot link -->
        <div class="lr-forgot-row">
          <router-link to="/reset-password" class="lr-forgot">¿Olvidaste tu contraseña?</router-link>
        </div>

        <!-- Submit -->
        <button type="button" class="lr-submit" :disabled="loading" @click="tryLogin">
          <span v-if="!loading">INICIAR SESIÓN</span>
          <span v-else class="lr-dots"><span></span><span></span><span></span></span>
        </button>

        <!-- Support -->
        <p class="lr-support">
          Para soporte técnico o acceso de nuevos inspectores, contacte con su
          supervisor de planta o al departamento de TI de <strong>Admin del Sistema</strong>.
        </p>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import logoSrc from '@/assets/logo.png'

const router = useRouter()
const route  = useRoute()
const auth   = useAuthStore()

const email    = ref('')
const password = ref('')
const loading  = ref(false)
const errorMsg = ref('')
const okMsg    = ref('')

// Leer mensaje de error que viene por query param desde el router
// onMounted: captura el query param en la carga inicial
onMounted(() => {
  checkRouteError()
})

// watch: captura el query param cuando el router navega DE VUELTA a /login
// sin desmontar el componente (ej: conductor sin acceso → router.push('/login?error=sin_acceso'))
// onMounted NO se ejecuta en ese caso porque Vue reutiliza la instancia del componente.
watch(() => route.query, () => {
  checkRouteError()
}, { immediate: false })

function checkRouteError() {
  if (route.query.reset === 'ok') {
    okMsg.value = 'Contraseña restablecida. Inicia sesión con tu nueva contraseña.'
    router.replace({ path: '/login' })
    return
  }
  if (route.query.error === 'sin_acceso') {
    errorMsg.value = 'Tu cuenta no tiene permisos para acceder al panel administrativo.'
    // Limpiar el query param de la URL para que no persista al recargar
    // sin navegar (reemplaza el estado sin añadir historial)
    router.replace({ path: '/login' })
  }
}
const showPwd  = ref(false)
const fEmail   = ref(false)
const fPass    = ref(false)
const vEmail   = ref<boolean|null>(null)
const vPass    = ref<boolean|null>(null)

function validateEmail(): boolean {
  const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)
  vEmail.value = email.value.length > 0 ? ok : false
  return ok
}

function validatePass(): boolean {
  const ok = password.value.length >= 6
  vPass.value = password.value.length > 0 ? ok : false
  return ok
}

async function tryLogin() {
  if (loading.value) return

  errorMsg.value = ''
  if (!validateEmail() || !validatePass()) return

  loading.value = true
  try {
    // Detectar SUPER_ROOT por dominio @system.local
    const isSuperRoot = email.value.endsWith('@system.local')

    const res: any = isSuperRoot
      ? await auth.superLogin(email.value, password.value)
      : await auth.login(email.value, password.value)

    // ADMIN y SUPER_ROOT pueden acceder al panel
    if (auth.user?.rol !== 'ADMIN' && auth.user?.rol !== 'SUPER_ROOT') {
      auth.logout()
      vEmail.value = false
      vPass.value = false
      errorMsg.value = 'Esta aplicación es solo para administradores. Los conductores deben usar la app de conductores.'
      return
    }

    // Contraseña temporal asignada por un admin → forzar cambio antes de continuar
    if (res?.mustChangePassword) {
      router.push('/password?forzado=1')
      return
    }

    router.push('/dashboard')
  } catch (err: any) {
    const status = err?.response?.status

    if (status === 401) {
      vEmail.value = false
      vPass.value  = false
      errorMsg.value = 'Correo o contraseña incorrectos. Inténtalo de nuevo.'
    } else if (status === 403) {
      vEmail.value   = false
      errorMsg.value = 'Tu cuenta no tiene acceso al panel administrativo. Contacta al administrador.'
    } else if (status === 404) {
      vEmail.value   = false
      errorMsg.value = 'Este correo no está registrado en el sistema.'
    } else if (status === 429) {
      errorMsg.value = 'Demasiados intentos fallidos. Espera unos minutos e intenta de nuevo.'
    } else if (status >= 500) {
      errorMsg.value = 'Error en el servidor. Inténtalo más tarde.'
    } else {
      errorMsg.value = 'Sin conexión. Verifica tu internet e intenta de nuevo.'
    }
    if (status !== 401) {
      vPass.value = null
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=Barlow:wght@400;500;600;700;800&display=swap');

.login-root { min-height:100vh;min-height:100dvh;display:flex;font-family:'Barlow',sans-serif;overflow:hidden; }

/* Left panel */
.login-left {
  flex:0 0 50%;position:relative;background:#0d1422;
  display:flex;flex-direction:column;padding:40px 52px;overflow:hidden;
}
.login-left::before {
  content:'';position:absolute;inset:0;pointer-events:none;
  background:
    radial-gradient(ellipse 90% 70% at 60% 30%,rgba(20,40,70,.45) 0%,transparent 70%),
    radial-gradient(ellipse 60% 80% at 10% 90%,rgba(60,20,15,.3) 0%,transparent 65%),
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='900'%3E%3Crect fill='%230d1422' width='800' height='900'/%3E%3C/svg%3E") center/cover;
}
.ll-overlay { position:absolute;inset:0;background:linear-gradient(160deg,rgba(8,14,28,.2) 0%,rgba(8,14,28,.5) 100%);pointer-events:none; }

.ll-logo-wrap { position:relative;z-index:1;width:140px;height:140px;flex-shrink:0; }
.ll-logo-img  { width:100%;height:100%;object-fit:contain;border-radius:15%;filter:drop-shadow(0 4px 18px rgba(0,0,0,.6)); }

.ll-hero { position:relative;z-index:1;margin-top:auto;margin-bottom:32px; }
.ll-eyebrow {
  font-family:'Barlow Condensed',sans-serif;font-size:11px;font-weight:700;
  letter-spacing:2.5px;color:rgba(255,255,255,.45);margin:0 0 18px;
}
.ll-headline {
  font-size:clamp(24px,2.8vw,36px);font-weight:800;color:#fff;
  line-height:1.22;margin:0 0 18px;letter-spacing:-.3px;
}
.ll-desc { font-size:15px;color:rgba(255,255,255,.48);line-height:1.65;margin:0;max-width:380px; }
.ll-footer {
  position:relative;z-index:1;
  font-family:'Barlow Condensed',sans-serif;font-size:11px;font-weight:600;
  letter-spacing:2px;color:rgba(255,255,255,.22);
}

/* Right panel */
.login-right {
  flex:0 0 50%;background:#fff;
  display:flex;align-items:center;justify-content:center;
  padding:60px 48px;overflow-y:auto;
}
.lr-wrap { width:100%;max-width:420px; }
.lr-header { margin-bottom:32px; }
.lr-title { font-size:32px;font-weight:800;color:#0d1422;margin:0 0 6px;letter-spacing:-.5px; }
.lr-sub   { font-size:15px;color:#6b7c93;margin:0; }

.lr-error {
  display:flex;align-items:center;gap:9px;
  background:#fef2f2;border:1px solid #fecaca;
  border-radius:8px;padding:11px 14px;
  font-size:13.5px;color:#dc2626;font-weight:500;margin-bottom:22px;
}
.lr-ok {
  display:flex;align-items:center;gap:9px;
  background:#f0fdf4;border:1px solid #bbf7d0;
  border-radius:8px;padding:11px 14px;
  font-size:13.5px;color:#166534;font-weight:600;margin-bottom:22px;
}
.err-t-enter-active { animation:errSlide .3s cubic-bezier(.22,1,.36,1); }
@keyframes errSlide { from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)} }

.lr-fb { margin-bottom:20px; }
.lr-label {
  display:block;font-family:'Barlow Condensed',sans-serif;
  font-size:11px;font-weight:700;letter-spacing:1.5px;color:#3d4f63;margin-bottom:8px;
}
.lr-field {
  display:flex;align-items:center;gap:10px;
  background:#f3f4f6;border:1.5px solid #f3f4f6;
  border-radius:8px;padding:13px 14px;
  transition:border-color .18s,background .18s,box-shadow .18s;
}
.lr-focus { border-color:#1a2540;background:#fff;box-shadow:0 0 0 3px rgba(26,37,64,.08); }
.lr-err-f { border-color:#dc2626;box-shadow:0 0 0 3px rgba(220,38,38,.07); }
.lr-ok-f  { border-color:#22c55e; }
.lr-ico   { color:#8895a7;flex-shrink:0;transition:color .18s; }
.lr-focus .lr-ico { color:#1a2540; }
.lr-err-f .lr-ico { color:#dc2626; }
.lr-field input {
  flex:1;border:none;outline:none;background:none;
  font-size:15px;font-family:'Barlow',sans-serif;color:#0d1422;
}
.lr-field input::placeholder { color:#b0bbc9; }
.lr-field input:disabled { opacity:.6; }
.lr-chk  { flex-shrink:0; }
.lr-eye  { background:none;border:none;cursor:pointer;color:#8895a7;display:flex;padding:2px;transition:color .15s;flex-shrink:0; }
.lr-eye:hover { color:#1a2540; }
.lr-ferr { font-size:12px;color:#dc2626;font-weight:500;margin:5px 0 0; }

.lr-forgot-row { display:flex;justify-content:flex-end;margin:0 0 24px; }
.lr-forgot { background:none;border:none;cursor:pointer;font-size:14px;color:#1a2540;font-family:'Barlow',sans-serif;text-decoration:underline;text-underline-offset:2px;padding:0; }
.lr-forgot:hover { color:#e63d2f; }

.lr-submit {
  width:100%;padding:16px;background:#1a2540;color:#fff;border:none;border-radius:8px;
  font-family:'Barlow Condensed',sans-serif;font-size:16px;font-weight:800;letter-spacing:2px;
  cursor:pointer;display:flex;align-items:center;justify-content:center;
  box-shadow:0 4px 20px rgba(26,37,64,.28);
  transition:background .15s,transform .1s,box-shadow .15s;margin-bottom:28px;
}
.lr-submit:hover:not(:disabled) { background:#0d1422;transform:translateY(-1px);box-shadow:0 6px 24px rgba(26,37,64,.35); }
.lr-submit:active:not(:disabled) { transform:translateY(0); }
.lr-submit:disabled { opacity:.65;cursor:not-allowed; }

.lr-dots { display:flex;gap:5px;height:19px;align-items:center; }
.lr-dots span { width:7px;height:7px;border-radius:50%;background:rgba(255,255,255,.85);animation:bounce .8s infinite; }
.lr-dots span:nth-child(2){animation-delay:.13s}.lr-dots span:nth-child(3){animation-delay:.26s}
@keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-7px)}}

.lr-support { font-size:13px;color:#8895a7;line-height:1.6;text-align:center;margin:0; }
.lr-support strong { color:#0d1422; }

@media(max-width:768px){
  .login-root { flex-direction:column; }
  .login-left { flex:0 0 240px;padding:28px 28px 32px; }
  .ll-logo-wrap { width:80px;height:80px; }
  .ll-headline { font-size:22px; }
  .login-right { flex:1;padding:36px 22px; }
  .lr-title { font-size:26px; }
}
</style>