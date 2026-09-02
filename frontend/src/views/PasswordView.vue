<template>
  <div class="pw-shell">
    <div class="pw-card">
      <div class="pw-head">
        <div class="pw-icon">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect x="3.5" y="8.5" width="13" height="9" rx="2" stroke="currentColor" stroke-width="1.4"/>
            <path d="M6.5 8.5V6a3.5 3.5 0 0 1 7 0v2.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
            <circle cx="10" cy="13" r="1.4" fill="currentColor"/>
          </svg>
        </div>
        <h1 class="pw-title">Cambiar contraseña</h1>
        <p class="pw-sub">Por seguridad, al cambiarla se cerrarán tus demás sesiones</p>
      </div>

      <Transition name="pw-t">
        <div v-if="notice" class="pw-notice" role="alert">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="currentColor" stroke-width="1.2"/><path d="M7 4.2v3.6M7 9.8v.4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
          {{ notice }}
        </div>
      </Transition>

      <Transition name="pw-t">
        <div v-if="okMsg" class="pw-ok" role="status">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" fill="#22c55e"/><path d="M4.4 7l1.8 2L9.6 5" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          {{ okMsg }}
        </div>
      </Transition>

      <Transition name="pw-t">
        <div v-if="errorMsg" class="pw-err" role="alert">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="currentColor" stroke-width="1.2"/><path d="M7 4.2v3.6M7 9.8v.4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
          {{ errorMsg }}
        </div>
      </Transition>

      <template v-if="!done">
        <div class="pw-fb">
          <label class="pw-label" for="pw-cur">CONTRASEÑA ACTUAL</label>
          <div class="pw-field" :class="{'pw-err-f': vCur === false}">
            <input
              id="pw-cur"
              v-model="current"
              :type="showCur ? 'text' : 'password'"
              autocomplete="current-password"
              placeholder="••••••••••"
              :disabled="loading"
              @keyup.enter="submit"
            />
            <button type="button" class="pw-eye" tabindex="-1" @click="showCur = !showCur" :aria-label="showCur ? 'Ocultar' : 'Mostrar'">
              <svg v-if="!showCur" width="15" height="15" viewBox="0 0 15 15" fill="none"><ellipse cx="7.5" cy="7.5" rx="6" ry="4" stroke="currentColor" stroke-width="1.2"/><circle cx="7.5" cy="7.5" r="2" stroke="currentColor" stroke-width="1.2"/></svg>
              <svg v-else width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M1 1l13 13M5.5 5.6A2.2 2.2 0 0 0 9.4 9.5M3 3.5C1.8 4.7 1.1 6.1 1 7.5c.9 3 3.6 5 6.5 5 1.1 0 2.2-.3 3.1-.9M5.3 2.8C6 2.6 6.7 2.5 7.5 2.5c2.9 0 5.6 2 6.5 5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>
            </button>
          </div>
        </div>

        <div class="pw-fb">
          <label class="pw-label" for="pw-new">NUEVA CONTRASEÑA</label>
          <div class="pw-field" :class="{'pw-err-f': vNew === false}">
            <input
              id="pw-new"
              v-model="next"
              :type="showNew ? 'text' : 'password'"
              autocomplete="new-password"
              placeholder="Mínimo 8 caracteres"
              :disabled="loading"
              @input="vNew = null; errorMsg = ''"
              @blur="validateNew"
              @keyup.enter="submit"
            />
            <button type="button" class="pw-eye" tabindex="-1" @click="showNew = !showNew" :aria-label="showNew ? 'Ocultar' : 'Mostrar'">
              <svg v-if="!showNew" width="15" height="15" viewBox="0 0 15 15" fill="none"><ellipse cx="7.5" cy="7.5" rx="6" ry="4" stroke="currentColor" stroke-width="1.2"/><circle cx="7.5" cy="7.5" r="2" stroke="currentColor" stroke-width="1.2"/></svg>
              <svg v-else width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M1 1l13 13M5.5 5.6A2.2 2.2 0 0 0 9.4 9.5M3 3.5C1.8 4.7 1.1 6.1 1 7.5c.9 3 3.6 5 6.5 5 1.1 0 2.2-.3 3.1-.9M5.3 2.8C6 2.6 6.7 2.5 7.5 2.5c2.9 0 5.6 2 6.5 5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>
            </button>
          </div>
          <p v-if="vNew === false" class="pw-ferr">Mínimo 8 caracteres (máximo 72)</p>
        </div>

        <div class="pw-fb">
          <label class="pw-label" for="pw-conf">CONFIRMAR NUEVA CONTRASEÑA</label>
          <div class="pw-field" :class="{'pw-err-f': vConf === false}">
            <input
              id="pw-conf"
              v-model="confirm"
              :type="showNew ? 'text' : 'password'"
              autocomplete="new-password"
              placeholder="Repite la nueva contraseña"
              :disabled="loading"
              @keyup.enter="submit"
            />
          </div>
          <p v-if="vConf === false" class="pw-ferr">Las contraseñas no coinciden</p>
        </div>

        <button class="pw-btn" :disabled="loading" @click="submit">
          <span v-if="!loading">ACTUALIZAR CONTRASEÑA</span>
          <span v-else class="pw-dots"><span></span><span></span><span></span></span>
        </button>
      </template>

      <div v-else class="pw-done-actions">
        <button class="pw-btn" @click="goHome">CONTINUAR</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import api from '../api'
import { useAuthStore } from '../stores/auth'

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
const okMsg    = ref('')
const notice   = ref('')
const done     = ref(false)
const vCur     = ref<boolean | null>(null)
const vNew     = ref<boolean | null>(null)
const vConf    = ref<boolean | null>(null)

onMounted(() => {
  if (route.query.forzado === '1') {
    notice.value = 'Estás usando una contraseña temporal. Debes crear una nueva para continuar.'
  }
  window.scrollTo(0, 0)
})

function validateNew(): boolean {
  const ok = next.value.length >= 8 && next.value.length <= 72
  vNew.value = next.value.length > 0 ? ok : false
  return ok
}

async function submit() {
  errorMsg.value = ''
  okMsg.value = ''
  vCur.value = current.value.length > 0
  vConf.value = confirm.value === next.value && confirm.value.length > 0
  if (!validateNew()) { errorMsg.value = 'La nueva contraseña debe tener entre 8 y 72 caracteres.'; return }
  if (!vCur.value)  { errorMsg.value = 'Ingresa tu contraseña actual.'; return }
  if (!vConf.value) { errorMsg.value = 'Las contraseñas no coinciden.'; return }

  loading.value = true
  try {
    const res = await api.post<{ message: string; refresh_token: string }>('/auth/change-password', {
      current_password: current.value,
      new_password: next.value,
    })
    // El backend revoca las sesiones anteriores y emite un refresh nuevo para esta
    if (res.data?.refresh_token) {
      auth.refreshToken = res.data.refresh_token
      sessionStorage.setItem('refresh_token', res.data.refresh_token)
    }
    done.value = true
    okMsg.value = 'Contraseña actualizada correctamente.'
  } catch (e: any) {
    const msg = e?.response?.data?.message
    errorMsg.value = Array.isArray(msg) ? msg[0] : (msg || 'No fue posible actualizar la contraseña.')
  } finally {
    loading.value = false
  }
}

function goHome() {
  router.push('/dashboard')
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800;900&family=Barlow:wght@400;500;600;700;800&display=swap');
.pw-shell{min-height:100vh;background:var(--bg);display:flex;align-items:flex-start;justify-content:center;padding:48px 18px;font-family:'Barlow',sans-serif}
.pw-card{background:var(--surface);border:1px solid var(--border);border-radius:14px;box-shadow:var(--shadow-md);width:100%;max-width:440px;padding:30px 28px}
.pw-head{text-align:center;margin-bottom:20px}
.pw-icon{width:46px;height:46px;margin:0 auto 12px;border-radius:12px;background:var(--navy);color:#fff;display:flex;align-items:center;justify-content:center}
.pw-title{font-family:'Barlow Condensed',sans-serif;font-size:24px;font-weight:900;color:var(--text);margin:0 0 6px;letter-spacing:.4px}
.pw-sub{font-size:13px;color:var(--text3);margin:0;line-height:1.45}
.pw-notice{display:flex;align-items:center;gap:8px;background:#fffbeb;border:1px solid #fde68a;color:#92400e;border-radius:8px;padding:10px 12px;font-size:13px;font-weight:600;margin-bottom:12px}
.pw-ok{display:flex;align-items:center;gap:8px;background:#f0fdf4;border:1px solid #bbf7d0;color:#166534;border-radius:8px;padding:10px 12px;font-size:13px;font-weight:600;margin-bottom:12px}
.pw-err{display:flex;align-items:center;gap:8px;background:#fff5f5;border:1px solid #fecaca;color:#dc2626;border-radius:8px;padding:10px 12px;font-size:13px;font-weight:600;margin-bottom:12px}
.pw-fb{margin-bottom:16px;text-align:left}
.pw-label{display:block;font-family:'Barlow Condensed',sans-serif;font-size:11px;font-weight:700;letter-spacing:1.2px;color:var(--text3);margin-bottom:7px}
.pw-field{display:flex;align-items:center;gap:8px;background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:0 12px;transition:border-color .15s}
.pw-field:focus-within{border-color:var(--navy)}
.pw-err-f{border-color:#e63d2f !important}
.pw-field input{flex:1;border:none;outline:none;background:none;font-size:14px;font-family:'Barlow',sans-serif;color:var(--text);padding:11px 0;min-width:0}
.pw-field input::placeholder{color:#b0bac8}
.pw-eye{background:none;border:none;cursor:pointer;color:var(--text3);display:flex;padding:2px}
.pw-eye:hover{color:var(--text)}
.pw-ferr{font-size:12px;color:#e63d2f;font-weight:600;margin:6px 0 0}
.pw-btn{width:100%;margin-top:6px;padding:13px 16px;background:var(--navy);color:#fff;border:none;border-radius:8px;font-family:'Barlow Condensed',sans-serif;font-size:14px;font-weight:800;letter-spacing:1.6px;cursor:pointer;transition:background .15s,transform .1s;box-shadow:0 4px 16px rgba(26,37,64,.22)}
.pw-btn:hover:not(:disabled){background:var(--navy-dark);transform:translateY(-1px)}
.pw-btn:disabled{opacity:.65;cursor:not-allowed}
.pw-done-actions{margin-top:10px}
.pw-dots{display:flex;gap:5px;align-items:center;justify-content:center}
.pw-dots span{width:7px;height:7px;border-radius:50%;background:rgba(255,255,255,.8);animation:pwd .8s infinite}
.pw-dots span:nth-child(2){animation-delay:.14s}.pw-dots span:nth-child(3){animation-delay:.28s}
@keyframes pwd{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-7px)}}
.pw-t-enter-active{animation:pwin .18s ease}
.pw-t-leave-active{animation:pwin .12s reverse}
@keyframes pwin{from{opacity:0;transform:translateY(-5px)}to{opacity:1;transform:translateY(0)}}
</style>
