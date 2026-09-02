<template>
  <div class="perfil-shell">

    <header class="topbar">
      <div class="tb-left">
        <img :src="logoImg" alt="Logo" class="tb-logo" />
        <span class="tb-brand">PREOPERACIONAL</span>
      </div>
    </header>

    <!-- Header del inspector -->
    <div class="ph-header">
      <div class="ph-avatar">{{ initiales }}</div>
      <h2 class="ph-name">{{ auth.fullName }}</h2>
      <span class="ph-role">INSPECTOR AUTORIZADO</span>
    </div>

    <div class="ph-body">

      <!-- Datos -->
      <div class="data-card">
        <p class="dc-section">IDENTIFICACIÓN</p>
        <div class="dc-row">
          <span class="dc-label">NOMBRE</span>
          <span class="dc-val">{{ auth.fullName || '—' }}</span>
        </div>
        <div class="dc-row">
          <span class="dc-label">CÉDULA</span>
          <span class="dc-val">{{ auth.cedula || '—' }}</span>
        </div>
        <div class="dc-row">
          <span class="dc-label">CORREO</span>
          <span class="dc-val small">{{ auth.user?.email || '—' }}</span>
        </div>
        <div class="dc-row" v-if="auth.user">
          <span class="dc-label">TELÉFONO</span>
          <span class="dc-val">{{ auth.user?.telefono || '—' }}</span>
        </div>
      </div>

      <!-- Vehículo -->
      <div class="vehicle-display" v-if="auth.placa">
        <p class="dc-section">VEHÍCULO ASIGNADO</p>
        <div class="vd-plate">{{ auth.placa }}</div>
        <p class="vd-sub">Placa registrada en el sistema</p>
      </div>

      <!-- Estado -->
      <div class="data-card">
        <p class="dc-section">ESTADO DE CUENTA</p>
        <div class="dc-row">
          <span class="dc-label">ROL</span>
          <span class="dc-badge role">{{ auth.user?.rol === 'ADMIN' ? 'ADMINISTRADOR' : 'CONDUCTOR' }}</span>
        </div>
        <div class="dc-row">
          <span class="dc-label">ESTADO</span>
          <span class="dc-badge" :class="auth.enVacaciones ? 'vacation' : 'active'">{{ auth.enVacaciones ? 'EN VACACIONES' : 'ACTIVO' }}</span>
        </div>
        <div v-if="auth.enVacaciones && auth.vacacion" class="dc-row">
          <span class="dc-label">VACACIONES</span>
          <span class="dc-val small">{{ auth.vacacion.fechaInicio }} al {{ auth.vacacion.fechaFin }}</span>
        </div>
      </div>

      <!-- Logout se maneja desde la pestaña Salir de la barra inferior -->

    </div>



  
    <div class="logout-tip">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M6 13H3a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h3M10 10l3-3-3-3M5 7h8" stroke="#8892a4" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
      <span>Para cerrar sesión usa la pestaña <strong>Salir</strong> de la barra inferior</span>
    </div>
</div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import logoImg from '../assets/Logo.png'

const auth       = useAuthStore()
const router     = useRouter()

onMounted(() => { window.scrollTo(0, 0) })

const initiales = computed(() =>
  (auth.fullName || 'U').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0,2)
)

</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&family=Barlow+Condensed:wght@600;700;800;900&display=swap');
.perfil-shell { min-height:100vh;background:#edf0f5;font-family:'Barlow',sans-serif;padding-bottom:90px; }
.topbar { background:#fff;padding:calc(env(safe-area-inset-top) + 14px) 18px 12px;display:flex;align-items:center;border-bottom:1px solid #dde2ec;position:sticky;top:0;z-index:50; }
.tb-left { display:flex;align-items:center;gap:8px; }
.tb-logo { width:32px;height:32px;object-fit:contain;border-radius:6px; }
.tb-brand { font-family:'Barlow Condensed',sans-serif;font-size:16px;font-weight:800;color:#1a2540;letter-spacing:1px; }
.ph-header { background:#1a2540;padding:22px 20px;text-align:center; }
.ph-avatar { width: clamp(56px, 16vw, 68px);height: clamp(56px, 16vw, 68px);border-radius:50%;background:#e63d2f;color:#fff;font-family:'Barlow Condensed',sans-serif;font-size: clamp(20px, 5.5vw, 24px);font-weight:900;display:flex;align-items:center;justify-content:center;margin:0 auto 12px;box-shadow:0 4px 20px rgba(0,0,0,.3); }
.ph-name { font-family:'Barlow Condensed',sans-serif;font-size: clamp(20px, 5.5vw, 24px);font-weight:900;color:#fff;margin:0 0 6px;letter-spacing:.5px; }
.ph-role { font-family:'Barlow Condensed',sans-serif;font-size:11px;font-weight:700;letter-spacing:2px;color:rgba(255,255,255,.4); }
.ph-body { padding:12px 16px; }
.data-card { background:#fff;border-radius:8px;padding:14px 16px;margin-bottom:10px; }
.vehicle-display { background:#fff;border-radius:8px;padding:16px;margin-bottom:10px;text-align:center; }
.dc-section { font-family:'Barlow Condensed',sans-serif;font-size:11px;font-weight:700;letter-spacing:1.5px;color:#8892a4;margin:0 0 12px; }
.dc-row { display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f1f5f9; }
.dc-row:last-child { border:none; }
.dc-label { font-family:'Barlow Condensed',sans-serif;font-size:11px;font-weight:700;letter-spacing:1px;color:#8892a4; }
.dc-val { font-size:14px;font-weight:600;color:#1a2540; }
.dc-val.small { font-size:12px; }
.dc-badge { font-family:'Barlow Condensed',sans-serif;font-size:11px;font-weight:700;letter-spacing:.8px;padding:4px 10px;border-radius:4px; }
.dc-badge.role   { background:#eff6ff;color:#1a2540; }
.dc-badge.active { background:#f0f8f4;color:#27ae60; }
.dc-badge.vacation { background:#fffbeb;color:#92400e; }
.vd-plate { font-family:'Barlow Condensed',sans-serif;font-size: clamp(28px, 8vw, 38px);font-weight:900;color:#1a2540;letter-spacing:4px;margin:12px 0 6px; }
.vd-sub { font-size:12px;color:#8892a4; }


.modal-card h3 { font-family:'Barlow Condensed',sans-serif;font-size:22px;font-weight:900;color:#1a2540;margin:0 0 8px;letter-spacing:1px; }
.modal-card p { font-size:14px;color:#8892a4;margin:0 0 22px;line-height:1.5; }





@keyframes fadeIn{from{opacity:0}to{opacity:1}}

.logout-tip {
  display: flex; align-items: center; gap: 8px;
  margin: 4px 18px 24px;
  padding: 12px 14px;
  background: #f8fafc; border-radius: 8px; border: 1px solid #e8ecf2;
  font-size: 12px; color: #8892a4; line-height: 1.5;
}
.logout-tip strong { color: #1a2540; }
.logout-tip svg { flex-shrink: 0; }
.server-url { font-size:11px;color:#8892a4;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap; }
.btn-cambiar { font-family:'Barlow Condensed',sans-serif;font-size:11px;font-weight:700;letter-spacing:1px;color:#e63d2f;background:none;border:none;cursor:pointer;padding:8px 0 0;display:block;width:100%;text-align:left; }
.url-edit { margin-top:10px;display:flex;flex-wrap:wrap;gap:6px; }
.url-input { flex:1;min-width:140px;padding:8px 10px;border:1px solid #d0d8e8;border-radius:6px;font-size:16px;font-family:'Barlow',sans-serif;color:#1a2540;outline:none; }
.url-input:focus { border-color:#1a2540; }
.btn-guardar { background:#1a2540;color:#fff;border:none;border-radius:6px;padding:8px 14px;font-family:'Barlow Condensed',sans-serif;font-size:11px;font-weight:700;letter-spacing:1px;cursor:pointer; }
.url-error { width:100%;font-size:12px;color:#e63d2f;margin:4px 0 0; }
</style>
