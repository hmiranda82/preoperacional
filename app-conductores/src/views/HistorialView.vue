<template>
  <div class="hist-shell">

    <header class="topbar">
      <div class="tb-left">
        <img :src="logoImg" alt="Logo" class="tb-logo" />
        <span class="tb-brand">PREOPERACIONAL</span>
      </div>
    </header>

    <div v-if="loading" class="state-center">
      <div class="spinner"></div>
      <p>CARGANDO HISTORIAL...</p>
    </div>

    <div v-else-if="loadError" class="empty-state">
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none"><circle cx="32" cy="32" r="24" stroke="#f1c0c0" stroke-width="2.5"/><path d="M32 22v12M32 39v1" stroke="#e63d2f" stroke-width="2.5" stroke-linecap="round"/></svg>
      <p class="es-title">ERROR DE CARGA</p>
      <p class="es-sub">{{ loadError }}</p>
      <button class="retry-btn" type="button" @click="load">REINTENTAR</button>
    </div>

    <div v-else-if="!responses.length" class="empty-state">
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none"><rect x="12" y="8" width="40" height="48" rx="5" stroke="#dde2ec" stroke-width="2.5"/><path d="M22 22h20M22 32h20M22 42h12" stroke="#dde2ec" stroke-width="2.5" stroke-linecap="round"/></svg>
      <p class="es-title">SIN INSPECCIONES</p>
      <p class="es-sub">No has enviado ninguna revisión aún.</p>
    </div>

    <div v-else class="hist-content">

      <!-- Stats row -->
      <div class="stats-row">
        <div class="stat-item">
          <span class="stat-num">{{ responses.length }}</span>
          <span class="stat-lbl">TOTAL</span>
        </div>
        <div class="stat-sep"></div>
        <div class="stat-item">
          <span class="stat-num ok">{{ okCount }}</span>
          <span class="stat-lbl">SIN NOVEDAD</span>
        </div>
        <div class="stat-sep"></div>
        <div class="stat-item">
          <span class="stat-num bad">{{ badCount }}</span>
          <span class="stat-lbl">CON NOVEDAD</span>
        </div>
      </div>

      <!-- Lista -->
      <div class="hist-list">
        <div
          v-for="(r, i) in responses"
          :key="r.id"
          class="hist-item"
          :style="{animationDelay: i * 0.04 + 's'}"
          @click="openDetail(r)"
        >
          <div class="hi-left">
            <div class="hi-plate">{{ r.placa }}</div>
            <div class="hi-meta">
              <span>{{ r.ciudad }}</span>
              <span class="hi-dot">·</span>
              <span>{{ fmtDate(r.fecha) }}</span>
            </div>
          </div>
          <div class="hi-right">
            <span class="hi-badge" :class="getStatus(r).cls">{{ getStatus(r).lbl }}</span>
            <svg class="hi-arrow" width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom sheet detail -->
    <Transition name="sheet-t">
      <div v-if="sheet && selected" class="sheet-overlay" @click.self="sheet=false">
        <div class="sheet">
          <div class="sheet-handle"></div>
          <div class="sheet-header">
            <div>
              <p class="sh-eyebrow">INSPECCIÓN #{{ selected.id }}</p>
              <h3 class="sh-plate">{{ selected.placa }}</h3>
              <span class="sh-status" :class="getStatus(selected).cls">{{ getStatus(selected).lbl }}</span>
            </div>
            <button class="sh-close" @click="sheet=false">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M4 4l10 10M14 4L4 14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
            </button>
          </div>

          <div class="sheet-meta">
            <div class="sm-row"><span>Ciudad</span><strong>{{ selected.ciudad }}</strong></div>
            <div class="sm-row"><span>Contrato</span><strong>{{ selected.contrato }}</strong></div>
            <div class="sm-row"><span>Fecha</span><strong>{{ fmtFull(selected.fecha) }}</strong></div>
          </div>

          <!-- Foto del vehículo (si fue tomada) -->
          <div v-if="selected.imagenVehiculoUrl" class="sv-photo-wrap">
            <p class="sb-label">FOTO DEL VEHÍCULO</p>
            <div class="sv-photo-container">
              <img
                :src="uploadUrl(selected.imagenVehiculoUrl)"
                alt="Foto del vehículo"
                class="sv-photo-img"
                @error="(e) => ((e.target as HTMLImageElement).style.display = 'none')"
              />
              <a
                :href="uploadUrl(selected.imagenVehiculoUrl)"
                target="_blank"
                rel="noopener noreferrer"
                class="sv-photo-link"
              >
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                  <path d="M6 2H3a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V8M9 1h4m0 0v4m0-4L6 8"
                    stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Ver foto completa
              </a>
            </div>
          </div>

          <div class="sheet-body">
            <p class="sb-label">RESPUESTAS ({{ selected.answers?.length }})</p>
            <div class="answer-list">
              <div v-for="a in selected.answers" :key="a.id" class="answer-item">
                <div class="ai-top">
                  <p class="ai-q">{{ a.question?.texto }}</p>
                  <span class="ai-val" :class="valCls(a.valor)">{{ fmtVal(a.valor) }}</span>
                </div>
                <p v-if="a.observacion" class="ai-obs">{{ a.observacion }}</p>
                <img v-if="a.imagenUrl" :src="uploadUrl(a.imagenUrl)" class="ai-img" alt="Foto"/>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>

  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import logoImg from '../assets/Logo.png'
import { getUserResponses } from '../services/inspection.service'
import { useAuthStore } from '../stores/auth'
import { uploadUrl } from '../utils/uploadUrl'
import type { ResponseRecord } from '../types'

const auth = useAuthStore()
const responses = ref<ResponseRecord[]>([])
const loading = ref(false)
const loadError = ref('')
const sheet = ref(false)
const selected = ref<ResponseRecord | null>(null)

const hasBad = (response: ResponseRecord) =>
  response.answers.some((answer) => answer.valor === 'NO' || answer.valor === 'false')

const okCount = computed(() => responses.value.filter((response) => !hasBad(response)).length)
const badCount = computed(() => responses.value.filter(hasBad).length)

function getStatus(response: ResponseRecord) {
  if (hasBad(response)) return { lbl: 'CON NOVEDAD', cls: 'st-bad' }
  if (response.answers.some((answer) => answer.valor === 'OBSERVACION')) return { lbl: 'OBSERVACIÓN', cls: 'st-obs' }
  return { lbl: 'SIN NOVEDAD', cls: 'st-ok' }
}

function fmtDate(date: string) {
  return new Date(date).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: '2-digit' })
}

function fmtFull(date: string) {
  return new Date(date).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })
}

function fmtVal(value: string) {
  const labels: Record<string, string> = {
    OK: 'BUENO',
    NO: 'MALO',
    OBSERVACION: 'OBS.',
    true: 'BUENO',
    false: 'MALO',
  }

  return labels[value] || value
}

function valCls(value: string) {
  if (value === 'OK' || value === 'true') return 'val-ok'
  if (value === 'NO' || value === 'false') return 'val-bad'
  return 'val-obs'
}

function openDetail(response: ResponseRecord) {
  selected.value = response
  sheet.value = true
}

async function load() {
  loading.value = true
  loadError.value = ''

  try {
    responses.value = await getUserResponses(auth.userId)
  } catch {
    loadError.value = 'No fue posible consultar el historial de inspecciones.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  window.scrollTo(0, 0)
  load()
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&family=Barlow+Condensed:wght@600;700;800;900&display=swap');
.hist-shell { min-height:100vh;background:#edf0f5;font-family:'Barlow',sans-serif;padding-bottom:90px; }
.topbar { background:#fff;padding:calc(env(safe-area-inset-top) + 14px) 18px 12px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #dde2ec;position:sticky;top:0;z-index:50; }
.tb-left { display:flex;align-items:center;gap:8px; }
.tb-logo { width:32px;height:32px;object-fit:contain;border-radius:6px; }
.tb-brand { font-family:'Barlow Condensed',sans-serif;font-size:16px;font-weight:800;color:#1a2540;letter-spacing:1px; }
.state-center { display:flex;flex-direction:column;align-items:center;gap:12px;padding:80px 24px;color:#8892a4;font-family:'Barlow Condensed',sans-serif;font-size:12px;letter-spacing:1.5px; }
.spinner { width:44px;height:44px;border-radius:50%;border:3px solid #e8ecf2;border-top-color:#1a2540;animation:spin 1s linear infinite; }
@keyframes spin{to{transform:rotate(360deg)}}
.empty-state { display:flex;flex-direction:column;align-items:center;gap:12px;padding:60px 28px;text-align:center; }
.es-title { font-family:'Barlow Condensed',sans-serif;font-size:18px;font-weight:800;color:#1a2540;letter-spacing:2px;margin:0; }
.es-sub   { font-size:13px;color:#8892a4;margin:0; }
.retry-btn { margin-top: 8px; padding: 10px 16px; border: none; border-radius: 8px; background: #1a2540; color: #fff; font-family: 'Barlow Condensed', sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 1px; cursor: pointer; }
.stats-row { background:#fff;padding:16px 18px;display:flex;align-items:center;border-bottom:1px solid #e8ecf2; }
.stat-item { flex:1;display:flex;flex-direction:column;align-items:center;gap:2px; }
.stat-num  { font-family:'Barlow Condensed',sans-serif;font-size: clamp(20px, 5.5vw, 24px);font-weight:900;color:#1a2540;line-height:1; }
.stat-num.ok { color:#27ae60; }
.stat-num.bad { color:#e63d2f; }
.stat-lbl  { font-family:'Barlow Condensed',sans-serif;font-size:10px;font-weight:700;letter-spacing:1px;color:#8892a4; }
.stat-sep  { width:1px;height:36px;background:#e8ecf2; }
.hist-list { padding:8px 0; }
.hist-item { display:flex;align-items:center;justify-content:space-between;background:#fff;padding:14px 18px;border-bottom:1px solid #f1f5f9;cursor:pointer;transition:background .1s;animation:fadeIn .4s ease both; }
.hist-item:hover { background:#f8fafc; }
@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
.hi-plate { font-family:'Barlow Condensed',sans-serif;font-size:20px;font-weight:900;color:#1a2540;letter-spacing:2px;margin-bottom:3px; }
.hi-meta  { display:flex;align-items:center;gap:4px;font-size:12px;color:#8892a4; }
.hi-dot   { opacity:.4; }
.hi-right { display:flex;align-items:center;gap:8px; }
.hi-badge { font-family:'Barlow Condensed',sans-serif;font-size:11px;font-weight:700;letter-spacing:.8px;padding:3px 10px;border-radius:4px; }
.st-ok  { background:#f0f8f4;color:#27ae60; }
.st-bad { background:#fdf3f3;color:#e63d2f; }
.st-obs { background:#fffbeb;color:#d97706; }
.hi-arrow { color:#8892a4; }
/* Sheet */
.sheet-overlay { position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:200;display:flex;align-items:flex-end; }
.sheet { background:#fff;border-radius:20px 20px 0 0;width:100%;max-height:88vh;display:flex;flex-direction:column;animation:sheetUp .3s cubic-bezier(.22,1,.36,1); }
@keyframes sheetUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
.sheet-handle { width:36px;height:4px;border-radius:99px;background:#e8ecf2;margin:12px auto 0;flex-shrink:0; }
.sheet-header { display:flex;align-items:flex-start;justify-content:space-between;padding:14px 18px 12px;border-bottom:1px solid #f1f5f9;flex-shrink:0; }
.sh-eyebrow { font-family:'Barlow Condensed',sans-serif;font-size:10px;font-weight:700;letter-spacing:1.5px;color:#8892a4;margin:0 0 3px; }
.sh-plate { font-family:'Barlow Condensed',sans-serif;font-size: clamp(22px, 6vw, 26px);font-weight:900;color:#1a2540;margin:0 0 6px;letter-spacing:2px; }
.sh-status { font-family:'Barlow Condensed',sans-serif;font-size:11px;font-weight:700;letter-spacing:.8px;padding:3px 10px;border-radius:4px;display:inline-block; }
.sh-close { background:#f8fafc;border:1px solid #e8ecf2;border-radius:8px;width:34px;height:34px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#8892a4; }
.sheet-meta { padding:12px 18px;border-bottom:1px solid #f1f5f9;flex-shrink:0; }
.sm-row { display:flex;align-items:baseline;gap:14px;padding:5px 0;font-size:13px;color:#8892a4; }
.sm-row span { flex-shrink:0;min-width:70px; }
.sm-row strong { color:#1a2540;font-weight:600;word-break:break-word; }
.sheet-body { flex:1;overflow-y:auto;padding:18px 20px 28px; }
.sb-label { font-family:'Barlow Condensed',sans-serif;font-size:11px;font-weight:700;letter-spacing:1.2px;color:#8892a4;margin:0 0 12px; }
.answer-list { display:flex;flex-direction:column;gap:0; }
.answer-item { padding:16px 0 20px;border-bottom:1px solid #f1f5f9; }
.answer-item:last-child { border:none; }
.ai-top { display:flex;align-items:flex-start;justify-content:space-between;gap:12px; }
.ai-q   { font-size:14px;color:#1a2540;font-weight:500;margin:0;flex:1;line-height:1.6; }
.ai-val { font-family:'Barlow Condensed',sans-serif;font-size:13px;font-weight:700;padding:4px 12px;border-radius:5px;flex-shrink:0;margin-top:2px; }
.val-ok  { background:#f0f8f4;color:#27ae60; }
.val-bad { background:#fdf3f3;color:#e63d2f; }
.val-obs { background:#fffbeb;color:#d97706; }
.ai-obs { font-size:13px;color:#4a5568;margin:10px 12px 0;padding:8px 12px;background:#f8fafc;border-radius:6px;border-left:3px solid #dde2ec;line-height:1.5; }
.ai-img { width:100%;height:120px;object-fit:cover;border-radius:8px;margin-top:8px; }
.sheet-t-enter-active { animation:fadeIn .25s ease; }
.sheet-t-leave-active { animation:fadeIn .18s ease reverse; }

/* ── Foto del vehículo en detalle de inspección ── */
.sv-photo-wrap { padding: 0 18px 16px; }
.sv-photo-container { position: relative; border-radius: 10px; overflow: hidden; box-shadow: 0 3px 14px rgba(0,0,0,.14); margin-top: 10px; }
.sv-photo-img { width: 100%; max-height: 150px; object-fit: cover; display: block; }
.sv-photo-link {
  display: flex; align-items: center; gap: 7px;
  padding: 6px 12px; background: rgba(26,37,64,.88); color: rgba(255,255,255,.85);
  font-family: 'Barlow Condensed', sans-serif; font-size: 11px; font-weight: 700;
  letter-spacing: .8px; text-decoration: none;
}
.sv-photo-link:hover { background: rgba(26,37,64,.95); }

</style>
