<template>
  <div class="page">
    <div class="page-head">
      <div>
        <h1 class="page-title">AUSENCIAS</h1>
        <p class="page-sub">Gestiona días no laborales puntuales de los conductores (permisos, día familiar, votaciones)</p>
      </div>
      <button class="btn-primary" @click="openCreate" v-if="auth.isAdmin">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>
        NUEVA AUSENCIA
      </button>
    </div>

    <div v-if="loading" class="skel-wrap">
      <div v-for="n in 5" :key="n" class="skel-r"></div>
    </div>

    <div v-else-if="!activeAusencias.length" class="empty-state">
      <svg width="52" height="52" viewBox="0 0 52 52" fill="none"><circle cx="26" cy="26" r="24" stroke="#d4d9e3" stroke-width="2"/><path d="M16 22l4-6h12l4 6M16 22v10a2 2 0 002 2h16a2 2 0 002-2V22M26 30v4" stroke="#d4d9e3" stroke-width="2" stroke-linecap="round"/></svg>
      <p class="empty-t">Sin ausencias registradas</p>
      <p class="empty-s">Registra días no laborales para excluirlos de métricas de cumplimiento</p>
    </div>

    <div v-else class="tcard">
      <table class="tbl">
        <thead>
          <tr>
            <th>CONDUCTOR</th>
            <th>CÉDULA</th>
            <th>PLACA</th>
            <th>FECHA</th>
            <th>MOTIVO</th>
            <th>ESTADO</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(a, i) in activeAusencias" :key="a.id" :style="{ '--ri': i }">
            <td>
              <div class="u-cell">
                <div class="u-av" :style="{ background: avBg(a.driver?.nombre || '') }">
                  {{ (a.driver?.nombre || '?').charAt(0).toUpperCase() }}
                </div>
                <div>
                  <div class="u-name">{{ a.driver?.nombre || '—' }}</div>
                </div>
              </div>
            </td>
            <td class="td-mono">{{ a.driver?.cedula || '—' }}</td>
            <td><span v-if="a.driver?.placa" class="placa-badge">{{ a.driver.placa }}</span><span v-else class="td-empty">—</span></td>
            <td class="td-mono">{{ a.fecha }}</td>
            <td class="td-mono">{{ a.motivo || '—' }}</td>
            <td>
              <span class="sbadge" :class="a.activo ? 'sb-on' : 'sb-off'">
                {{ a.activo ? 'ACTIVO' : 'CANCELADO' }}
              </span>
            </td>
            <td>
              <div class="row-btns" v-if="a.activo && auth.isAdmin">
                <button class="rb-del" @click="askCancel(a)" title="Cancelar ausencia">
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 3.5h9M4.5 3.5V2.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v1M10 3.5l-.7 7a.9.9 0 0 1-.9.8H4.6a.9.9 0 0 1-.9-.8L3 3.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <Teleport to="body">
      <Transition name="modal-t">
        <div v-if="modalOpen" class="modal-overlay" @click.self="closeModal">
          <div class="modal-box">
            <div class="modal-head">
              <div class="modal-icon mi-new">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M16 8v6a2 2 0 01-2 2H4a2 2 0 01-2-2V4a2 2 0 012-2h6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
                  <path d="M15 2l-6 6M11 2h4v4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <div>
                <h3 class="modal-title">Nueva ausencia</h3>
                <p class="modal-sub">Registra un día no laboral para un conductor</p>
              </div>
              <button class="modal-close" @click="closeModal">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 2.5l9 9M11.5 2.5l-9 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
              </button>
            </div>

            <div class="modal-body">
              <div class="form-grid">
                <div class="ff ff--full">
                  <label class="ff-label">Conductor <span class="req">*</span></label>
                  <div class="sel-wrap">
                    <select v-model="mf.driverId" class="ff-input" :class="{ 'ff-input--err': ferr.driverId }">
                      <option :value="0" disabled>Selecciona un conductor</option>
                      <option v-for="d in driverOptions" :key="d.id" :value="d.id">{{ d.nombre }} — {{ d.cedula }} ({{ d.placa || 'sin placa' }})</option>
                    </select>
                    <svg class="sel-arr" width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 4.5l3 3 3-3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  </div>
                  <p v-if="ferr.driverId" class="ff-err">Selecciona un conductor</p>
                </div>

                <div class="ff ff--full">
                  <label class="ff-label">Fecha <span class="req">*</span></label>
                  <input v-model="mf.fecha" type="date" class="ff-input" :class="{ 'ff-input--err': ferr.fecha }" @blur="ferr.fecha = !mf.fecha" />
                  <p v-if="ferr.fecha" class="ff-err">La fecha es obligatoria</p>
                </div>

                <div class="ff ff--full">
                  <label class="ff-label">Motivo <span class="req">*</span></label>
                  <div class="sel-wrap">
                    <select v-model="mf.motivo" class="ff-input" :class="{ 'ff-input--err': ferr.motivo }">
                      <option value="" disabled>Selecciona un motivo</option>
                      <option value="PERMISO">Permiso</option>
                      <option value="DIA_FAMILIA">Día de la Familia</option>
                      <option value="VOTACION">Votaciones Electorales</option>
                      <option value="CAPACITACION">Capacitación</option>
                      <option value="FESTIVO_EMPRESA">Festivo Empresarial</option>
                      <option value="OTRO">Otro</option>
                    </select>
                    <svg class="sel-arr" width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 4.5l3 3 3-3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  </div>
                  <p v-if="ferr.motivo" class="ff-err">Selecciona un motivo</p>
                </div>
              </div>

              <div v-if="mError" class="modal-err" role="alert">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="#dc2626" stroke-width="1.2"/><path d="M7 4v3.5M7 9.5v.5" stroke="#dc2626" stroke-width="1.2" stroke-linecap="round"/></svg>
                {{ mError }}
              </div>
            </div>

            <div class="modal-foot">
              <button class="btn-cancel" @click="closeModal">Cancelar</button>
              <button class="btn-save" :disabled="mSaving" @click="save">
                <span v-if="!mSaving">Crear ausencia</span>
                <span v-else class="btn-dots"><span></span><span></span><span></span></span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <Teleport to="body">
      <Transition name="modal-t">
        <div v-if="cancelModal" class="modal-overlay" @click.self="cancelModal=false">
          <div class="modal-box modal-sm">
            <h3 class="del-title">¿Cancelar ausencia?</h3>
            <p class="del-body">Se desactivará esta ausencia para <strong>{{ toCancel?.driver?.nombre }}</strong> el día <strong>{{ toCancel?.fecha }}</strong>.</p>
            <div class="del-actions">
              <button class="btn-cancel" @click="cancelModal=false">No</button>
              <button class="btn-danger" :disabled="cancelling" @click="doCancel">Sí, cancelar</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import api from '../api'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()

interface DriverOpt {
  id: number; nombre: string; cedula: string; placa: string | null
}
interface AusenciaItem {
  id: number; driverId: number; fecha: string
  motivo: string | null; activo: boolean
  driver?: { id: number; nombre: string; cedula: string; placa: string | null } | null
}

const ausencias = ref<AusenciaItem[]>([])
const drivers = ref<DriverOpt[]>([])
const loading = ref(false)
const modalOpen = ref(false)
const cancelModal = ref(false)
const cancelling = ref(false)
const mSaving = ref(false)
const mError = ref('')
const toCancel = ref<AusenciaItem | null>(null)

const mf = reactive({
  driverId: 0, fecha: '', motivo: '',
})
const ferr = reactive({
  driverId: false, fecha: false, motivo: false,
})

const todayStr = new Date().toLocaleDateString('en-CA')
const activeAusencias = computed(() =>
  ausencias.value.filter(a => a.fecha >= todayStr)
)

const AV_BG = ['#1a2540','#2d4a7a','#3a6b8c','#4a5568','#2c5364'] as const
function avBg(name?: string): string {
  const n = name || 'U'
  return AV_BG[n.charCodeAt(0) % AV_BG.length]!
}

const driverOptions = computed(() => drivers.value)

async function load() {
  loading.value = true
  try {
    const [aRes, uRes] = await Promise.all([
      api.get<AusenciaItem[]>('/ausencias'),
      api.get<any[]>('/users'),
    ])
    ausencias.value = Array.isArray(aRes.data) ? aRes.data : []
    const users = Array.isArray(uRes.data) ? uRes.data : []
    drivers.value = users
      .filter((u: any) => (u.rol === 'CONDUCTOR' || u.rol === 'DRIVER'))
      .map((u: any) => ({ id: u.driver?.id ?? 0, nombre: u.nombre, cedula: u.cedula, placa: u.placa ?? null }))
      .filter((d: any) => d.id > 0)
  } catch (e: any) {
    console.error('[Ausencias] load:', e)
  } finally {
    loading.value = false
  }
}

function openCreate() {
  Object.assign(mf, { driverId: 0, fecha: '', motivo: '' })
  Object.assign(ferr, { driverId: false, fecha: false, motivo: false })
  mError.value = ''
  modalOpen.value = true
}

function closeModal() {
  modalOpen.value = false
  mError.value = ''
}

async function save() {
  mError.value = ''
  ferr.driverId = !mf.driverId
  ferr.fecha = !mf.fecha
  ferr.motivo = !mf.motivo

  if (ferr.driverId || ferr.fecha || ferr.motivo) {
    mError.value = 'Completa todos los campos obligatorios.'
    return
  }

  mSaving.value = true
  try {
    await api.post('/ausencias', {
      driverId: mf.driverId,
      fecha: mf.fecha,
      motivo: mf.motivo,
    })
    closeModal()
    await load()
  } catch (e: any) {
    const msg = e?.response?.data?.message
    mError.value = Array.isArray(msg) ? msg[0] : (msg || 'Error al guardar.')
  } finally {
    mSaving.value = false
  }
}

function askCancel(a: AusenciaItem) {
  toCancel.value = a
  cancelModal.value = true
}

async function doCancel() {
  if (!toCancel.value || cancelling.value) return
  cancelling.value = true
  try {
    await api.patch(`/ausencias/${toCancel.value.id}/cancel`)
  } catch (e: any) {
    console.error('[Ausencias] cancel:', e)
  } finally {
    cancelling.value = false
    cancelModal.value = false
    await load()
  }
}

onMounted(load)
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=Barlow:wght@400;500;600;700&display=swap');
.page { font-family:'Barlow',sans-serif; max-width:1400px; }
.page-head { display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:20px;gap:12px;flex-wrap:wrap; }
.page-title { font-family:'Barlow Condensed',sans-serif;font-size:30px;font-weight:900;color:#0d1422;margin:0 0 4px;letter-spacing:.5px; }
.page-sub   { font-size:13px;color:#8895a7;margin:0; }
.btn-primary { display:inline-flex;align-items:center;gap:7px;background:#1a2540;color:#fff;border:none;border-radius:7px;padding:10px 18px;font-family:'Barlow Condensed',sans-serif;font-size:13px;font-weight:700;letter-spacing:1px;cursor:pointer;box-shadow:0 3px 12px rgba(26,37,64,.25);transition:background .15s,transform .1s; }
.btn-primary:hover { background:#0d1422;transform:translateY(-1px); }
.skel-wrap { padding:14px;display:flex;flex-direction:column;gap:8px; }
.skel-r { height:44px;border-radius:7px;background:linear-gradient(90deg,#f2f4f7 25%,#e8eaf0 50%,#f2f4f7 75%);background-size:400% 100%;animation:skel 1.5s infinite; }
@keyframes skel { 0%{background-position:400%0}100%{background-position:-400%0} }
.empty-state { text-align:center;padding:56px;display:flex;flex-direction:column;align-items:center;gap:10px; }
.empty-t { font-family:'Barlow Condensed',sans-serif;font-size:18px;font-weight:800;color:#0d1422;margin:0; }
.empty-s { font-size:13px;color:#8895a7;margin:0; }
.tcard { background:#fff;border:1px solid #e4e7ed;border-radius:10px;overflow:hidden; }
.tbl { width:100%;border-collapse:collapse; }
.tbl th { text-align:left;font-family:'Barlow Condensed',sans-serif;font-size:10px;font-weight:700;letter-spacing:1.2px;color:#8895a7;padding:10px 14px;border-bottom:1px solid #f0f2f6;white-space:nowrap; }
.tbl tbody tr { border-bottom:1px solid #f5f7fa;animation:rIn .3s ease calc(var(--ri,0)*.04s) both;transition:background .1s; }
.tbl tbody tr:last-child { border-bottom:none; }
.tbl tbody tr:hover { background:#fafbfc; }
.tbl td { padding:11px 14px;vertical-align:middle;font-size:13px;color:#0d1422; }
@keyframes rIn { from{opacity:0;transform:translateX(-5px)}to{opacity:1;transform:translateX(0)} }
.u-cell { display:flex;align-items:center;gap:10px; }
.u-av { width:32px;height:32px;border-radius:8px;color:#fff;font-family:'Barlow Condensed',sans-serif;font-size:13px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0; }
.u-name { font-size:13px;font-weight:600;color:#0d1422; }
.td-mono { font-size:12px;color:#4a5568;font-variant-numeric:tabular-nums; }
.td-empty { color:#b0bbc9; }
.placa-badge { display:inline-block;padding:2px 8px;background:#f2f4f7;border:1px solid #e4e7ed;border-radius:4px;font-family:'Barlow Condensed',sans-serif;font-size:12px;font-weight:700;letter-spacing:.8px; }
.sbadge { display:inline-flex;align-items:center;gap:5px;font-family:'Barlow Condensed',sans-serif;font-size:10px;font-weight:700;letter-spacing:.8px;padding:3px 9px;border-radius:4px; }
.sbadge::before { content:'';width:5px;height:5px;border-radius:50%;background:currentColor; }
.sb-on  { background:#f0fdf4;color:#166534; }
.sb-off { background:#f9fafb;color:#6b7280;border:1px solid #e5e7eb; }
.row-btns { display:flex;gap:4px; }
.rb-del { width:28px;height:28px;border-radius:6px;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .15s;background:rgba(230,61,47,.07);color:#e63d2f; }
.rb-del:hover { background:rgba(230,61,47,.14); }

/* Modal */
.modal-overlay { position:fixed;inset:0;background:rgba(0,0,0,.45);backdrop-filter:blur(3px);z-index:500;display:flex;align-items:center;justify-content:center;padding:16px; }
.modal-box { background:#fff;border:1px solid #e4e7ed;border-radius:12px;width:100%;max-width:520px;max-height:92vh;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,.18); }
.modal-sm { max-width:360px;text-align:center;padding:32px 28px; }
.modal-head { display:flex;align-items:flex-start;gap:12px;padding:20px 22px 16px;border-bottom:1px solid #f0f2f6;flex-shrink:0; }
.modal-icon { width:40px;height:40px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;background:#f0f4f8;color:#1a2540; }
.modal-title { font-family:'Barlow Condensed',sans-serif;font-size:16px;font-weight:800;color:#0d1422;margin:0 0 2px;letter-spacing:.3px; }
.modal-sub { font-size:12px;color:#8895a7;margin:0; }
.modal-close { margin-left:auto;background:none;border:none;cursor:pointer;color:#8895a7;display:flex;padding:6px;border-radius:7px;transition:background .15s;flex-shrink:0; }
.modal-close:hover { background:#f2f4f7; }
.modal-body { padding:18px 22px;overflow-y:auto;flex:1; }
.form-grid { display:grid;grid-template-columns:1fr 1fr;gap:14px; }
@media(max-width:480px){ .form-grid { grid-template-columns:1fr; } }
.ff { display:flex;flex-direction:column;gap:5px; }
.ff--full { grid-column:1/-1; }
.ff-label { font-family:'Barlow Condensed',sans-serif;font-size:10px;font-weight:700;letter-spacing:1.2px;color:#4a5568; }
.req { color:#e63d2f; }
.ff-input { border:1.5px solid #e4e7ed;border-radius:7px;background:#f8f9fa;padding:10px 12px;font-size:14px;font-family:'Barlow',sans-serif;color:#0d1422;outline:none;transition:all .2s;width:100%; }
.ff-input:focus { border-color:#1a2540;background:#fff;box-shadow:0 0 0 3px rgba(26,37,64,.08); }
.ff-input--err { border-color:#e63d2f !important; }
.ff-err { font-size:11px;color:#e63d2f;font-weight:600;margin:3px 0 0; }
.sel-wrap { position:relative; }
.sel-arr { position:absolute;right:12px;top:50%;transform:translateY(-50%);color:#8895a7;pointer-events:none; }
.sel-wrap select { appearance:none;padding-right:28px; }
.modal-err { display:flex;align-items:center;gap:8px;margin-top:14px;padding:10px 14px;background:#fef2f2;border:1px solid #fecaca;border-radius:7px;font-size:12px;color:#dc2626;font-weight:500; }
.modal-foot { display:flex;justify-content:flex-end;gap:10px;padding:14px 22px;border-top:1px solid #f0f2f6;flex-shrink:0; }
.btn-cancel { padding:9px 18px;border:1.5px solid #d4d9e3;border-radius:7px;background:#fff;color:#4a5568;font-family:'Barlow Condensed',sans-serif;font-size:12px;font-weight:700;letter-spacing:1px;cursor:pointer;transition:background .15s; }
.btn-cancel:hover { background:#f2f4f7; }
.btn-save { padding:9px 22px;border:none;border-radius:7px;background:#1a2540;color:#fff;font-family:'Barlow Condensed',sans-serif;font-size:12px;font-weight:700;letter-spacing:1px;cursor:pointer;transition:background .15s; }
.btn-save:hover:not(:disabled) { background:#0d1422; }
.btn-save:disabled { opacity:.5;cursor:not-allowed; }
.btn-dots { display:flex;gap:4px;align-items:center;justify-content:center; }
.btn-dots span { width:4px;height:4px;border-radius:50%;background:#fff;animation:dots .8s infinite; }
.btn-dots span:nth-child(2) { animation-delay:.15s; }
.btn-dots span:nth-child(3) { animation-delay:.3s; }
@keyframes dots { 0%,80%,100%{opacity:.3}40%{opacity:1} }
.btn-danger { padding:9px 18px;border:none;border-radius:7px;background:#e63d2f;color:#fff;font-family:'Barlow Condensed',sans-serif;font-size:12px;font-weight:700;letter-spacing:1px;cursor:pointer; }
.btn-danger:hover { background:#c42d20; }
.del-title { font-family:'Barlow Condensed',sans-serif;font-size:17px;font-weight:800;color:#0d1422;margin:0 0 6px; }
.del-body { font-size:13px;color:#4a5568;margin:0 0 20px; }
.del-actions { display:flex;gap:10px;justify-content:center; }
.modal-t-enter-active,.modal-t-leave-active { transition:opacity .2s; }
.modal-t-enter-from,.modal-t-leave-to { opacity:0; }
</style>
