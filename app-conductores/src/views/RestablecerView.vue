<template>
  <div class="rs-shell">

    <header class="topbar">
      <div class="tb-left">
        <img :src="logoImg" alt="Logo" class="tb-logo" />
        <span class="tb-brand">PREOPERACIONAL</span>
      </div>
    </header>

    <div class="rs-body">

      <div class="rs-head">
        <div class="rs-icon">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect x="3.5" y="8.5" width="13" height="9" rx="2" stroke="currentColor" stroke-width="1.4"/>
            <path d="M6.5 8.5V6a3.5 3.5 0 0 1 7 0v2.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
            <circle cx="10" cy="13" r="1.4" fill="currentColor"/>
          </svg>
        </div>
        <h1 class="rs-title">Restablecer contraseña</h1>
        <p class="rs-sub">Ingresa el token que te entregó un administrador y crea tu nueva contraseña</p>
      </div>

      <Transition name="rs-t">
        <div v-if="errorMsg" class="rs-error" role="alert">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="currentColor" stroke-width="1.2"/><path d="M7 4.2v3.6M7 9.8v.4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
          {{ errorMsg }}
        </div>
      </Transition>

      <template v-if="!done">
        <div class="rs-fb">
          <label class="rs-label">TOKEN DE RESTABLECIMIENTO</label>
          <div class="rs-row" :class="{ err: vToken === false }">
            <svg class="rs-ico" width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M9.5 1.5h4a1 1 0 0 1 1 1v4L9 12l-5-5L9.5 1.5Z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/><circle cx="11.5" cy="4.5" r="1" fill="currentColor"/><path d="M4 7l-2 2 5 5 2-2" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/></svg>
            <input
              v-model.trim="token"
              type="text"
              inputmode="text"
              autocomplete="off"
              spellcheck="false"
              placeholder="Código de 64 caracteres"
              class="rs-input mono"
              @input="vToken = null; errorMsg = ''"
              @keyup.enter="submit"
            />
          </div>
          <p v-if="vToken === false" class="rs-ferr">El token debe tener 64 caracteres hexadecimales</p>
        </div>

        <div class="rs-fb">
          <label class="rs-label">NUEVA CONTRASEÑA</label>
          <div class="rs-row" :class="{ err: vNew === false }">
            <svg class="rs-ico" width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2.5" y="7.5" width="11" height="7" rx="1.5" stroke="currentColor" stroke-width="1.2"/><path d="M5 7.5V5.8a3 3 0 0 1 6 0v1.7" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/><circle cx="8" cy="11" r="1.1" fill="currentColor"/></svg>
            <input
              v-model="next"
              :type="showNew ? 'text' : 'password'"
              placeholder="Mínimo 8 caracteres"
              autocomplete="new-password"
              class="rs-input"
              @input="vNew = null; errorMsg = ''"
              @keyup.enter="submit"
            />
            <button type="button" class="rs-eye" tabindex="-1" @click="showNew = !showNew" :aria-label="showNew ? 'Ocultar' : 'Mostrar'">
              <svg v-if="!showNew" width="17" height="17" viewBox="0 0 17 17" fill="none"><ellipse cx="8.5" cy="8.5" rx="6.5" ry="4.2" stroke="currentColor" stroke-width="1.2"/><circle cx="8.5" cy="8.5" r="1.9" stroke="currentColor" stroke-width="1.2"/></svg>
              <svg v-else width="17" height="17" viewBox="0 0 17 17" fill="none"><path d="M1.5 1.5l14 14M6.2 6.3A2.4 2.4 0 0 0 9.8 9.9M3.2 4C2 5.2 1.3 6.6 1.2 8.2c1 3.1 3.7 5.3 7.3 5.3 1.2 0 2.3-.3 3.3-.8M5.9 3.2c.8-.3 1.7-.4 2.6-.4 3.2 0 6 2.2 7 5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>
            </button>
          </div>
          <p v-if="vNew === false" class="rs-ferr">Mínimo 8 caracteres (máximo 72)</p>
        </div>

        <div class="rs-fb">
          <label class="rs-label">CONFIRMAR CONTRASEÑA</label>
          <div class="rs-row" :class="{ err: vConf === false }">
            <svg class="rs-ico" width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2.5" y="7.5" width="11" height="7" rx="1.5" stroke="currentColor" stroke-width="1.2"/><path d="M5 7.5V5.8a3 3 0 0 1 6 0v1.7" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/><circle cx="8" cy="11" r="1.1" fill="currentColor"/></svg>
            <input
              v-model="confirm"
              :type="showNew ? 'text' : 'password'"
              placeholder="Repite la nueva contraseña"
              autocomplete="new-password"
              class="rs-input"
              @input="vConf = null; errorMsg = ''"
              @keyup.enter="submit"
            />
          </div>
          <p v-if="vConf === false" class="rs-ferr">Las contraseñas no coinciden</p>
        </div>

        <button class="rs-btn" :disabled="loading" type="button" @click="submit">
          <template v-if="!loading"><span>RESTABLECER CONTRASEÑA</span></template>
          <span v-else class="rs-dots"><span></span><span></span><span></span></span>
        </button>

        <button class="rs-back" type="button" @click="router.replace('/login')">
          Volver a iniciar sesión
        </button>
      </template>

      <template v-else>
        <div class="rs-ok" role="status">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" fill="#27ae60"/><path d="M5 8l2.2 2.4L11.2 5.6" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <div>
            <p class="rs-ok-title">Contraseña restablecida</p>
            <p class="rs-ok-sub">Ya puedes iniciar sesión con tu nueva contraseña.</p>
          </div>
        </div>
        <button class="rs-btn" type="button" @click="router.replace('/login')">IR A INICIAR SESIÓN</button>
      </template>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '../api'
import logoImg from '../assets/Logo.png'

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

async function submit() {
  errorMsg.value = ''
  vToken.value = /^[0-9a-f]{64}$/.test(token.value) ? true : token.value.length > 0 ? false : null
  vNew.value = next.value.length >= 8 && next.value.length <= 72
  vConf.value = confirm.value === next.value && confirm.value.length > 0

  if (!token.value || !vToken.value) { errorMsg.value = 'Ingresa el token de 64 caracteres que te entregó el administrador.'; return }
  if (!vNew.value)  { errorMsg.value = 'La nueva contraseña debe tener entre 8 y 72 caracteres.'; return }
  if (!vConf.value) { errorMsg.value = 'Las contraseñas no coinciden.'; return }

  loading.value = true
  try {
    await api.post('/auth/reset-password', { token: token.value, new_password: next.value })
    done.value = true
  } catch (err: any) {
    const msg = err?.response?.data?.message
    errorMsg.value = Array.isArray(msg) ? msg[0]
      : msg ? String(msg)
      : 'El token es inválido, expiró o ya fue utilizado.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&family=Barlow+Condensed:wght@700;800;900&display=swap');
.rs-shell { min-height:100dvh;background:var(--bg-solid);display:flex;flex-direction:column;font-family:'Barlow',sans-serif;max-width:560px;margin:0 auto; }
.topbar { background:var(--topbar-bg);padding:calc(env(safe-area-inset-top) + 14px) 18px 12px;display:flex;align-items:center;border-bottom:1px solid var(--topbar-border);position:sticky;top:0;z-index:50; }
.tb-left { display:flex;align-items:center;gap:8px; }
.tb-logo { width:32px;height:32px;object-fit:contain;border-radius:6px; }
.tb-brand { font-family:'Barlow Condensed',sans-serif;font-size:15px;font-weight:800;color:var(--text);letter-spacing:1.5px; }
.rs-body { flex:1;padding:26px 22px calc(24px + env(safe-area-inset-bottom)); }
.rs-head { text-align:center;margin-bottom:24px; }
.rs-icon { width:52px;height:52px;margin:0 auto 12px;border-radius:14px;background:var(--accent-bg);color:var(--accent-text);display:flex;align-items:center;justify-content:center; }
.rs-title { font-family:'Barlow Condensed',sans-serif;font-size:clamp(22px,6vw,26px);font-weight:900;color:var(--text);margin:0 0 6px;letter-spacing:.5px; }
.rs-sub { font-size:13px;color:var(--muted);margin:0;line-height:1.5; }
.rs-error { display:flex;align-items:center;gap:8px;background:var(--alert-error-bg);border:1px solid var(--alert-error-border);color:var(--alert-error-text);border-radius:8px;padding:10px 12px;font-size:13px;font-weight:600;margin-bottom:16px;line-height:1.4; }
.rs-ok { display:flex;align-items:center;gap:10px;background:var(--alert-ok-bg);border:1px solid var(--alert-ok-border);border-radius:10px;padding:14px;margin-bottom:18px; }
.rs-ok-title { font-family:'Barlow Condensed',sans-serif;font-size:16px;font-weight:800;color:var(--text);margin:0 0 2px;letter-spacing:.4px; }
.rs-ok-sub { font-size:13px;color:var(--muted);margin:0; }
.rs-fb { margin-bottom:20px; }
.rs-label { display:block;font-family:'Barlow Condensed',sans-serif;font-size:11px;font-weight:700;letter-spacing:1.4px;color:var(--muted);margin-bottom:9px; }
.rs-row { display:flex;align-items:center;gap:10px;border-bottom:1.5px solid var(--border);padding:8px 4px;color:var(--muted);transition:border-color .2s,color .2s; }
.rs-row:focus-within { border-color:var(--text);color:var(--text); }
.rs-row.err { border-color:#e63d2f; }
.rs-ico { flex-shrink:0; }
.rs-input { flex:1;border:none;outline:none;background:none;font-size:15px;font-family:'Barlow',sans-serif;color:var(--text);min-width:0; }
.rs-input.mono { font-family:'Courier New',monospace;font-size:13px;letter-spacing:.5px; }
.rs-input::placeholder { color:var(--muted);font-family:'Barlow',sans-serif;font-size:14px; }
.rs-eye { background:none;border:none;cursor:pointer;color:var(--muted);padding:2px;display:flex;flex-shrink:0; }
.rs-eye:hover { color:var(--text); }
.rs-ferr { font-size:12px;color:#e63d2f;font-weight:600;margin:6px 0 0; }
.rs-btn { width:100%;padding:14px 20px;background:var(--accent-bg);color:var(--accent-text);border:none;border-radius:8px;font-family:'Barlow Condensed',sans-serif;font-size:clamp(14px,3.8vw,16px);font-weight:800;letter-spacing:2px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;margin-top:10px;transition:background .15s,transform .1s;box-shadow:0 4px 20px var(--shadow); }
.rs-btn:hover:not(:disabled) { background:var(--accent-bg-hover);transform:translateY(-1px); }
.rs-btn:disabled { opacity:.65;cursor:not-allowed; }
.rs-back { display:block;width:100%;background:none;border:none;cursor:pointer;font-family:'Barlow Condensed',sans-serif;font-size:13px;font-weight:700;letter-spacing:1px;color:var(--muted);padding:14px 0 0;text-align:center;transition:color .15s; }
.rs-back:hover { color:var(--text); }
.rs-dots { display:flex;gap:5px;align-items:center; }
.rs-dots span { width:7px;height:7px;border-radius:50%;background:rgba(255,255,255,.8);animation:rsd .8s infinite; }
.rs-dots span:nth-child(2){animation-delay:.14s}.rs-dots span:nth-child(3){animation-delay:.28s}
@keyframes rsd{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-7px)}}
.rs-t-enter-active { animation:rsin .18s ease; }
.rs-t-leave-active { animation:rsin .12s reverse; }
@keyframes rsin{from{opacity:0;transform:translateY(-5px)}to{opacity:1;transform:translateY(0)}}
</style>
