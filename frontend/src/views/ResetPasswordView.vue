<template>
  <div class="rp-shell">
    <div class="rp-card">
      <div class="rp-head">
        <div class="rp-icon">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M6.5 3L4 5.5L6.5 8M13.5 12L16 14.5L13.5 17" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
            <rect x="3.5" y="8.5" width="13" height="9" rx="2" stroke="currentColor" stroke-width="1.4" transform="translate(0 -3)"/>
            <circle cx="10" cy="10" r="1.3" fill="currentColor"/>
          </svg>
        </div>
        <h1 class="rp-title">Restablecer contraseña</h1>
        <p class="rp-sub">Ingresa el token que te entregó un administrador y crea tu nueva contraseña</p>
      </div>

      <Transition name="rp-t">
        <div v-if="errorMsg" class="rp-err" role="alert">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="currentColor" stroke-width="1.2"/><path d="M7 4.2v3.6M7 9.8v.4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
          {{ errorMsg }}
        </div>
      </Transition>

      <template v-if="!done">
        <div class="rp-fb">
          <label class="rp-label" for="rp-token">TOKEN DE RESTABLECIMIENTO</label>
          <div class="rp-field" :class="{'rp-err-f': vToken === false}">
            <input
              id="rp-token"
              v-model.trim="token"
              type="text"
              autocomplete="off"
              spellcheck="false"
              placeholder="Código de 64 caracteres"
              :disabled="loading"
              @input="vToken = null; errorMsg = ''"
              @keyup.enter="submit"
            />
          </div>
          <p v-if="vToken === false" class="rp-ferr">El token debe tener 64 caracteres hexadecimales</p>
        </div>

        <div class="rp-fb">
          <label class="rp-label" for="rp-new">NUEVA CONTRASEÑA</label>
          <div class="rp-field" :class="{'rp-err-f': vNew === false}">
            <input
              id="rp-new"
              v-model="next"
              :type="showNew ? 'text' : 'password'"
              autocomplete="new-password"
              placeholder="Mínimo 8 caracteres"
              :disabled="loading"
              @input="vNew = null; errorMsg = ''"
              @blur="validateNew"
              @keyup.enter="submit"
            />
            <button type="button" class="rp-eye" tabindex="-1" @click="showNew = !showNew" :aria-label="showNew ? 'Ocultar' : 'Mostrar'">
              <svg v-if="!showNew" width="15" height="15" viewBox="0 0 15 15" fill="none"><ellipse cx="7.5" cy="7.5" rx="6" ry="4" stroke="currentColor" stroke-width="1.2"/><circle cx="7.5" cy="7.5" r="2" stroke="currentColor" stroke-width="1.2"/></svg>
              <svg v-else width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M1 1l13 13M5.5 5.6A2.2 2.2 0 0 0 9.4 9.5M3 3.5C1.8 4.7 1.1 6.1 1 7.5c.9 3 3.6 5 6.5 5 1.1 0 2.2-.3 3.1-.9M5.3 2.8C6 2.6 6.7 2.5 7.5 2.5c2.9 0 5.6 2 6.5 5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>
            </button>
          </div>
          <p v-if="vNew === false" class="rp-ferr">Mínimo 8 caracteres (máximo 72)</p>
        </div>

        <div class="rp-fb">
          <label class="rp-label" for="rp-conf">CONFIRMAR CONTRASEÑA</label>
          <div class="rp-field" :class="{'rp-err-f': vConf === false}">
            <input
              id="rp-conf"
              v-model="confirm"
              :type="showNew ? 'text' : 'password'"
              autocomplete="new-password"
              placeholder="Repite la nueva contraseña"
              :disabled="loading"
              @keyup.enter="submit"
            />
          </div>
          <p v-if="vConf === false" class="rp-ferr">Las contraseñas no coinciden</p>
        </div>

        <button class="rp-btn" :disabled="loading" @click="submit">
          <span v-if="!loading">RESTABLECER CONTRASEÑA</span>
          <span v-else class="rp-dots"><span></span><span></span><span></span></span>
        </button>

        <router-link to="/login" class="rp-back">Volver a iniciar sesión</router-link>
      </template>

      <template v-else>
        <div class="rp-ok" role="status">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" fill="#22c55e"/><path d="M5 8l2.2 2.4L11.2 5.6" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Contraseña restablecida correctamente. Ya puedes iniciar sesión con tu nueva contraseña.
        </div>
        <button class="rp-btn" @click="$router.push('/login')">IR A INICIAR SESIÓN</button>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '../api'

const router   = useRouter()

const token    = ref('')
const next     = ref('')
const confirm  = ref('')
const showNew  = ref(false)
const loading  = ref(false)
const errorMsg = ref('')
const done     = ref(false)
const vToken   = ref<boolean | null>(null)
const vNew     = ref<boolean | null>(null)
const vConf    = ref<boolean | null>(null)

function validateToken(): boolean {
  const ok = /^[0-9a-f]{64}$/.test(token.value)
  vToken.value = token.value.length > 0 ? ok : false
  return ok
}
function validateNew(): boolean {
  const ok = next.value.length >= 8 && next.value.length <= 72
  vNew.value = next.value.length > 0 ? ok : false
  return ok
}

async function submit() {
  errorMsg.value = ''
  const tOk = validateToken()
  const nOk = validateNew()
  vConf.value = confirm.value === next.value && confirm.value.length > 0
  if (!tOk) { errorMsg.value = 'Ingresa el token de 64 caracteres que te entregó el administrador.'; return }
  if (!nOk) { errorMsg.value = 'La nueva contraseña debe tener entre 8 y 72 caracteres.'; return }
  if (!vConf.value) { errorMsg.value = 'Las contraseñas no coinciden.'; return }

  loading.value = true
  try {
    await api.post('/auth/reset-password', { token: token.value, new_password: next.value })
    done.value = true
  } catch (e: any) {
    const msg = e?.response?.data?.message
    errorMsg.value = Array.isArray(msg) ? msg[0] : (msg || 'El token es inválido, expiró o ya fue utilizado.')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800;900&family=Barlow:wght@400;500;600;700;800&display=swap');
.rp-shell{min-height:100vh;background:var(--bg);display:flex;align-items:flex-start;justify-content:center;padding:48px 18px;font-family:'Barlow',sans-serif}
.rp-card{background:var(--surface);border:1px solid var(--border);border-radius:14px;box-shadow:var(--shadow-md);width:100%;max-width:440px;padding:30px 28px}
.rp-head{text-align:center;margin-bottom:20px}
.rp-icon{width:46px;height:46px;margin:0 auto 12px;border-radius:12px;background:var(--navy);color:#fff;display:flex;align-items:center;justify-content:center}
.rp-title{font-family:'Barlow Condensed',sans-serif;font-size:24px;font-weight:900;color:var(--text);margin:0 0 6px;letter-spacing:.4px}
.rp-sub{font-size:13px;color:var(--text3);margin:0;line-height:1.45}
.rp-err{display:flex;align-items:center;gap:8px;background:#fff5f5;border:1px solid #fecaca;color:#dc2626;border-radius:8px;padding:10px 12px;font-size:13px;font-weight:600;margin-bottom:12px}
.rp-ok{display:flex;align-items:flex-start;gap:8px;background:#f0fdf4;border:1px solid #bbf7d0;color:#166534;border-radius:8px;padding:12px;font-size:13px;font-weight:600;margin-bottom:14px;line-height:1.5}
.rp-fb{margin-bottom:16px;text-align:left}
.rp-label{display:block;font-family:'Barlow Condensed',sans-serif;font-size:11px;font-weight:700;letter-spacing:1.2px;color:var(--text3);margin-bottom:7px}
.rp-field{display:flex;align-items:center;gap:8px;background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:0 12px;transition:border-color .15s}
.rp-field:focus-within{border-color:var(--navy)}
.rp-err-f{border-color:#e63d2f !important}
.rp-field input{flex:1;border:none;outline:none;background:none;font-size:14px;font-family:'Barlow',sans-serif;color:var(--text);padding:11px 0;min-width:0}
.rp-field input::placeholder{color:#b0bac8}
.rp-eye{background:none;border:none;cursor:pointer;color:var(--text3);display:flex;padding:2px}
.rp-eye:hover{color:var(--text)}
.rp-ferr{font-size:12px;color:#e63d2f;font-weight:600;margin:6px 0 0}
.rp-btn{width:100%;margin-top:6px;padding:13px 16px;background:var(--navy);color:#fff;border:none;border-radius:8px;font-family:'Barlow Condensed',sans-serif;font-size:14px;font-weight:800;letter-spacing:1.6px;cursor:pointer;transition:background .15s,transform .1s;box-shadow:0 4px 16px rgba(26,37,64,.22)}
.rp-btn:hover:not(:disabled){background:var(--navy-dark);transform:translateY(-1px)}
.rp-btn:disabled{opacity:.65;cursor:not-allowed}
.rp-back{display:block;text-align:center;margin-top:14px;font-size:12px;font-weight:600;color:var(--text3);text-decoration:none}
.rp-back:hover{color:var(--navy)}
.rp-dots{display:flex;gap:5px;align-items:center;justify-content:center}
.rp-dots span{width:7px;height:7px;border-radius:50%;background:rgba(255,255,255,.8);animation:rpd .8s infinite}
.rp-dots span:nth-child(2){animation-delay:.14s}.rp-dots span:nth-child(3){animation-delay:.28s}
@keyframes rpd{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-7px)}}
.rp-t-enter-active{animation:rpin .18s ease}
.rp-t-leave-active{animation:rpin .12s reverse}
@keyframes rpin{from{opacity:0;transform:translateY(-5px)}to{opacity:1;transform:translateY(0)}}
</style>
