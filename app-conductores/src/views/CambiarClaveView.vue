<template>
  <div class="cc-shell">

    <header class="topbar">
      <button class="tb-back" @click="goBack" aria-label="Volver">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M11.5 3.5L6 9l5.5 5.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
      <div class="tb-left">
        <img :src="logoImg" alt="Logo" class="tb-logo" />
        <span class="tb-brand">CAMBIAR CONTRASEÑA</span>
      </div>
    </header>

    <div class="cc-body">

      <Transition name="cc-t">
        <div v-if="notice" class="cc-notice" role="alert">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="currentColor" stroke-width="1.2"/><path d="M7 4.2v3.6M7 9.8v.4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
          {{ notice }}
        </div>
      </Transition>

      <Transition name="cc-t">
        <div v-if="errorMsg" class="cc-error" role="alert">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="currentColor" stroke-width="1.2"/><path d="M7 4.2v3.6M7 9.8v.4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
          {{ errorMsg }}
        </div>
      </Transition>

      <template v-if="!done">
        <div class="cc-fb">
          <label class="cc-label">CONTRASEÑA ACTUAL</label>
          <div class="cc-row" :class="{ err: vCur === false }">
            <svg class="cc-ico" width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2.5" y="7.5" width="11" height="7" rx="1.5" stroke="currentColor" stroke-width="1.2"/><path d="M5 7.5V5.8a3 3 0 0 1 6 0v1.7" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/><circle cx="8" cy="11" r="1.1" fill="currentColor"/></svg>
            <input
              v-model="current"
              :type="showCur ? 'text' : 'password'"
              placeholder="••••••••••"
              autocomplete="current-password"
              class="cc-input"
              @input="vCur = null; errorMsg = ''"
              @keyup.enter="submit"
            />
            <button type="button" class="cc-eye" tabindex="-1" @click="showCur = !showCur" :aria-label="showCur ? 'Ocultar' : 'Mostrar'">
              <svg v-if="!showCur" width="17" height="17" viewBox="0 0 17 17" fill="none"><ellipse cx="8.5" cy="8.5" rx="6.5" ry="4.2" stroke="currentColor" stroke-width="1.2"/><circle cx="8.5" cy="8.5" r="1.9" stroke="currentColor" stroke-width="1.2"/></svg>
              <svg v-else width="17" height="17" viewBox="0 0 17 17" fill="none"><path d="M1.5 1.5l14 14M6.2 6.3A2.4 2.4 0 0 0 9.8 9.9M3.2 4C2 5.2 1.3 6.6 1.2 8.2c1 3.1 3.7 5.3 7.3 5.3 1.2 0 2.3-.3 3.3-.8M5.9 3.2c.8-.3 1.7-.4 2.6-.4 3.2 0 6 2.2 7 5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>
            </button>
          </div>
        </div>

        <div class="cc-fb">
          <label class="cc-label">NUEVA CONTRASEÑA</label>
          <div class="cc-row" :class="{ err: vNew === false }">
            <svg class="cc-ico" width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2.5" y="7.5" width="11" height="7" rx="1.5" stroke="currentColor" stroke-width="1.2"/><path d="M5 7.5V5.8a3 3 0 0 1 6 0v1.7" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/><circle cx="8" cy="11" r="1.1" fill="currentColor"/></svg>
            <input
              v-model="next"
              :type="showNew ? 'text' : 'password'"
              placeholder="Mínimo 8 caracteres"
              autocomplete="new-password"
              class="cc-input"
              @input="vNew = null; errorMsg = ''"
              @keyup.enter="submit"
            />
            <button type="button" class="cc-eye" tabindex="-1" @click="showNew = !showNew" :aria-label="showNew ? 'Ocultar' : 'Mostrar'">
              <svg v-if="!showNew" width="17" height="17" viewBox="0 0 17 17" fill="none"><ellipse cx="8.5" cy="8.5" rx="6.5" ry="4.2" stroke="currentColor" stroke-width="1.2"/><circle cx="8.5" cy="8.5" r="1.9" stroke="currentColor" stroke-width="1.2"/></svg>
              <svg v-else width="17" height="17" viewBox="0 0 17 17" fill="none"><path d="M1.5 1.5l14 14M6.2 6.3A2.4 2.4 0 0 0 9.8 9.9M3.2 4C2 5.2 1.3 6.6 1.2 8.2c1 3.1 3.7 5.3 7.3 5.3 1.2 0 2.3-.3 3.3-.8M5.9 3.2c.8-.3 1.7-.4 2.6-.4 3.2 0 6 2.2 7 5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>
            </button>
          </div>
          <p v-if="vNew === false" class="cc-ferr">Mínimo 8 caracteres (máximo 72)</p>
        </div>

        <div class="cc-fb">
          <label class="cc-label">CONFIRMAR NUEVA CONTRASEÑA</label>
          <div class="cc-row" :class="{ err: vConf === false }">
            <svg class="cc-ico" width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2.5" y="7.5" width="11" height="7" rx="1.5" stroke="currentColor" stroke-width="1.2"/><path d="M5 7.5V5.8a3 3 0 0 1 6 0v1.7" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/><circle cx="8" cy="11" r="1.1" fill="currentColor"/></svg>
            <input
              v-model="confirm"
              :type="showNew ? 'text' : 'password'"
              placeholder="Repite la nueva contraseña"
              autocomplete="new-password"
              class="cc-input"
              @input="vConf = null; errorMsg = ''"
              @keyup.enter="submit"
            />
          </div>
          <p v-if="vConf === false" class="cc-ferr">Las contraseñas no coinciden</p>
        </div>

        <button class="cc-btn" :disabled="loading" type="button" @click="submit">
          <template v-if="!loading"><span>ACTUALIZAR CONTRASEÑA</span></template>
          <span v-else class="cc-dots"><span></span><span></span><span></span></span>
        </button>

        <p class="cc-note">
          Al cambiar tu contraseña se cerrarán tus demás sesiones abiertas.
        </p>
      </template>

      <template v-else>
        <div class="cc-ok" role="status">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" fill="#27ae60"/><path d="M5 8l2.2 2.4L11.2 5.6" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <div>
            <p class="cc-ok-title">Contraseña actualizada</p>
            <p class="cc-ok-sub">Tu nueva contraseña ya está activa.</p>
          </div>
        </div>
        <button class="cc-btn" type="button" @click="goHome">CONTINUAR</button>
      </template>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import api from '../api'
import { useAuthStore } from '../stores/auth'
import logoImg from '../assets/Logo.png'

const router  = useRouter()
const route   = useRoute()
const auth    = useAuthStore()

const current  = ref('')
const next     = ref('')
const confirm  = ref('')
const showCur  = ref(false)
const showNew  = ref(false)
const loading  = ref(false)
const errorMsg = ref('')
const notice   = ref('')
const done     = ref(false)
const vCur     = ref<boolean | null>(null)
const vNew     = ref<boolean | null>(null)
const vConf    = ref<boolean | null>(null)

onMounted(() => {
  window.scrollTo(0, 0)
  if (route.query.forzado === '1' || auth.mustChangePassword) {
    notice.value = 'Estás usando una contraseña temporal. Crea una nueva para continuar.'
  }
})

function goBack() {
  router.back()
}

async function submit() {
  errorMsg.value = ''
  vCur.value = current.value.length > 0
  vNew.value = next.value.length >= 8 && next.value.length <= 72
  vConf.value = confirm.value === next.value && confirm.value.length > 0

  if (!vCur.value)  { errorMsg.value = 'Ingresa tu contraseña actual.'; return }
  if (!vNew.value)  { errorMsg.value = 'La nueva contraseña debe tener entre 8 y 72 caracteres.'; return }
  if (!vConf.value) { errorMsg.value = 'Las contraseñas no coinciden.'; return }

  loading.value = true
  try {
    const res = await api.post<{ message: string; refresh_token: string }>('/auth/change-password', {
      current_password: current.value,
      new_password: next.value,
    })
    if (res.data?.refresh_token) {
      auth.setTokens(auth.token, res.data.refresh_token)
    }
    auth.setMustChangePassword(false)
    done.value = true
  } catch (err: any) {
    const s = err?.response?.status
    const msg = err?.response?.data?.message
    errorMsg.value = Array.isArray(msg) ? msg[0]
      : msg ? String(msg)
      : s === 400 ? 'Verifica los datos ingresados.'
      : s === 401 ? 'Tu sesión expiró. Vuelve a iniciar sesión.'
      : 'Error de conexión. Intenta de nuevo.'
  } finally {
    loading.value = false
  }
}

function goHome() {
  router.replace('/inspeccionar')
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&family=Barlow+Condensed:wght@700;800;900&display=swap');
.cc-shell { min-height:100dvh;background:#F3F4F6;display:flex;flex-direction:column;font-family:'Barlow',sans-serif; }
.topbar { background:#fff;padding:calc(env(safe-area-inset-top) + 14px) 18px 12px;display:flex;align-items:center;gap:12px;border-bottom:1px solid #dde2ec;position:sticky;top:0;z-index:50; }
.tb-back { background:none;border:none;cursor:pointer;color:#1a2540;display:flex;padding:4px;margin-left:-6px; }
.tb-left { display:flex;align-items:center;gap:8px; }
.tb-logo { width:30px;height:30px;object-fit:contain;border-radius:6px; }
.tb-brand { font-family:'Barlow Condensed',sans-serif;font-size:15px;font-weight:800;color:#1a2540;letter-spacing:1.2px; }
.cc-body { flex:1;padding:22px 22px calc(24px + env(safe-area-inset-bottom)); }
.cc-notice { display:flex;align-items:center;gap:8px;background:#fffbeb;border:1px solid #fde68a;color:#92400e;border-radius:8px;padding:10px 12px;font-size:13px;font-weight:600;margin-bottom:12px;line-height:1.4; }
.cc-error { display:flex;align-items:center;gap:8px;background:#fff5f5;border:1px solid #fecaca;color:#dc2626;border-radius:8px;padding:10px 12px;font-size:13px;font-weight:600;margin-bottom:16px;line-height:1.4; }
.cc-ok { display:flex;align-items:center;gap:10px;background:#f0f8f4;border:1px solid #c9ecd7;border-radius:10px;padding:14px;margin-bottom:18px; }
.cc-ok-title { font-family:'Barlow Condensed',sans-serif;font-size:16px;font-weight:800;color:#1a2540;margin:0 0 2px;letter-spacing:.4px; }
.cc-ok-sub { font-size:13px;color:#8892a4;margin:0; }
.cc-fb { margin-bottom:20px; }
.cc-label { display:block;font-family:'Barlow Condensed',sans-serif;font-size:11px;font-weight:700;letter-spacing:1.4px;color:#8892a4;margin-bottom:9px; }
.cc-row { display:flex;align-items:center;gap:10px;border-bottom:1.5px solid #d0d8e8;padding:8px 4px;color:#8892a4;transition:border-color .2s,color .2s; }
.cc-row:focus-within { border-color:#1a2540;color:#1a2540; }
.cc-row.err { border-color:#e63d2f; }
.cc-ico { flex-shrink:0; }
.cc-input { flex:1;border:none;outline:none;background:none;font-size:16px;font-family:'Barlow',sans-serif;color:#1a2540;min-width:0; }
.cc-input::placeholder { color:#b0bac8; }
.cc-eye { background:none;border:none;cursor:pointer;color:#8892a4;padding:2px;display:flex;flex-shrink:0; }
.cc-eye:hover { color:#1a2540; }
.cc-ferr { font-size:12px;color:#e63d2f;font-weight:600;margin:6px 0 0; }
.cc-btn { width:100%;padding:14px 20px;background:#1a2540;color:#fff;border:none;border-radius:8px;font-family:'Barlow Condensed',sans-serif;font-size:clamp(14px,3.8vw,16px);font-weight:800;letter-spacing:2px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;margin-top:10px;transition:background .15s,transform .1s;box-shadow:0 4px 20px rgba(26,37,64,.28); }
.cc-btn:hover:not(:disabled) { background:#0d1422;transform:translateY(-1px); }
.cc-btn:disabled { opacity:.65;cursor:not-allowed; }
.cc-note { font-size:12px;color:#8892a4;text-align:center;margin:14px 0 0;line-height:1.5; }
.cc-dots { display:flex;gap:5px;align-items:center; }
.cc-dots span { width:7px;height:7px;border-radius:50%;background:rgba(255,255,255,.8);animation:ccd .8s infinite; }
.cc-dots span:nth-child(2){animation-delay:.14s}.cc-dots span:nth-child(3){animation-delay:.28s}
@keyframes ccd{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-7px)}}
.cc-t-enter-active { animation:ccin .18s ease; }
.cc-t-leave-active { animation:ccin .12s reverse; }
@keyframes ccin{from{opacity:0;transform:translateY(-5px)}to{opacity:1;transform:translateY(0)}}
</style>
