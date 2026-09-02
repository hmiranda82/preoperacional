<template>
  <div class="page">
    <div class="page-head">
      <div>
        <h1 class="page-title">VACACIONES</h1>
        <p class="page-sub">Gestiona los períodos de vacaciones de los conductores — selecciona día por día</p>
      </div>
      <button class="btn-primary" @click="openCreate" v-if="auth.isAdmin">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>
        NUEVA VACACIÓN
      </button>
    </div>

    <div v-if="loading" class="skel-wrap">
      <div v-for="n in 5" :key="n" class="skel-r"></div>
    </div>

    <div v-else-if="!vacations.length" class="empty-state">
      <svg width="52" height="52" viewBox="0 0 52 52" fill="none"><circle cx="26" cy="26" r="24" stroke="#d4d9e3" stroke-width="2"/><path d="M16 22l4-6h12l4 6M16 22v10a2 2 0 002 2h16a2 2 0 002-2V22M26 30v4" stroke="#d4d9e3" stroke-width="2" stroke-linecap="round"/></svg>
      <p class="empty-t">Sin períodos de vacaciones registrados</p>
      <p class="empty-s">Registra las vacaciones de los conductores para excluirlos de métricas de cumplimiento</p>
    </div>

    <div v-else class="tcard">
      <table class="tbl">
        <thead>
          <tr>
            <th>CONDUCTOR</th>
            <th>CÉDULA</th>
            <th>PLACA</th>
            <th>RANGO</th>
            <th>DÍAS</th>
            <th>MOTIVO</th>
            <th>ESTADO</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(v, i) in vacations" :key="v.id" :style="{ '--ri': i }">
            <td>
              <div class="u-cell">
                <div class="u-av" :style="{ background: avBg(v.driver?.nombre || '') }">
                  {{ (v.driver?.nombre || '?').charAt(0).toUpperCase() }}
                </div>
                <div>
                  <div class="u-name">{{ v.driver?.nombre || '—' }}</div>
                </div>
              </div>
            </td>
            <td class="td-mono">{{ v.driver?.cedula || '—' }}</td>
            <td><span v-if="v.driver?.placa" class="placa-badge">{{ v.driver.placa }}</span><span v-else class="td-empty">—</span></td>
            <td class="td-mono">{{ v.fechaInicio }} → {{ v.fechaFin }}</td>
            <td class="td-mono">
              <span class="dias-badge">{{ v.days.length }} día{{ v.days.length !== 1 ? 's' : '' }}</span>
              <div v-if="v.days.length" class="dias-tooltip">
                <span v-for="d in v.days" :key="d.id" class="dias-dot" :title="d.fecha">{{ d.fecha.slice(5) }}</span>
              </div>
            </td>
            <td class="td-mono">{{ v.motivo || '—' }}</td>
            <td>
              <span class="sbadge" :class="v.activo ? 'sb-on' : 'sb-off'">
                {{ v.activo ? 'ACTIVO' : 'CANCELADO' }}
              </span>
            </td>
            <td>
              <div class="row-btns" v-if="v.activo && auth.isAdmin">
                <button class="rb-del" @click="askCancel(v)" title="Cancelar vacación">
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
          <div class="modal-box modal--wide">
            <div class="modal-head">
              <div class="modal-icon mi-new">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M16 8v6a2 2 0 01-2 2H4a2 2 0 01-2-2V4a2 2 0 012-2h6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
                  <path d="M15 2l-6 6M11 2h4v4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <div>
                <h3 class="modal-title">Nuevo período de vacaciones</h3>
                <p class="modal-sub">Define el rango y selecciona los días específicos de vacaciones</p>
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
                    <select v-model="mf.driverId" class="ff-input" :class="{ 'ff-input--err': ferr.driverId }" @change="onDriverChange">
                      <option :value="0" disabled>Selecciona un conductor</option>
                      <option v-for="d in driverOptions" :key="d.id" :value="d.id">{{ d.nombre }} — {{ d.cedula }} ({{ d.placa || 'sin placa' }})</option>
                    </select>
                    <svg class="sel-arr" width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 4.5l3 3 3-3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  </div>
                  <p v-if="ferr.driverId" class="ff-err">Selecciona un conductor</p>
                </div>

                <div class="ff">
                  <label class="ff-label">Fecha inicio <span class="req">*</span></label>
                  <input v-model="mf.fechaInicio" type="date" class="ff-input" :class="{ 'ff-input--err': ferr.fechaInicio }" @change="onRangeChange" />
                  <p v-if="ferr.fechaInicio" class="ff-err">La fecha de inicio es obligatoria</p>
                </div>

                <div class="ff">
                  <label class="ff-label">Fecha fin <span class="req">*</span></label>
                  <input v-model="mf.fechaFin" type="date" class="ff-input" :class="{ 'ff-input--err': ferr.fechaFin }" @change="onRangeChange" />
                  <p v-if="ferr.fechaFin" class="ff-err">La fecha de fin es obligatoria</p>
                </div>

                <div class="ff ff--full">
                  <label class="ff-label">Motivo (opcional)</label>
                  <input v-model="mf.motivo" type="text" class="ff-input" placeholder="Ej: Vacaciones anuales" />
                </div>
              </div>

              <!-- Calendar day picker -->
              <div v-if="rangeDays.length" class="cal-section">
                <div class="cal-header">
                  <span class="cal-title">Selecciona los días de vacaciones</span>
                  <span class="cal-count">{{ selectedDays.length }} / {{ rangeDays.length }} días</span>
                </div>
                <div class="cal-grid">
                  <div class="cal-dow" v-for="d in ['D','L','M','M','J','V','S']" :key="d">{{ d }}</div>
                  <div v-for="n in calendarOffset" :key="'off-'+n" class="cal-day cal-day--empty"></div>
                  <div
                    v-for="(day, idx) in rangeDays"
                    :key="idx"
                    class="cal-day"
                    :class="{
                      'cal-day--on': selectedSet.has(day),
                      'cal-day--rest': !selectedSet.has(day),
                    }"
                    @click="toggleDay(day)"
                  >
                    {{ day.slice(8) }}
                    <span v-if="!selectedSet.has(day)" class="cal-day-sub">R</span>
                  </div>
                </div>
                <p class="cal-hint">Los días hábiles (según diasLaborales del conductor) se preseleccionan automáticamente. Haz clic para cambiar.</p>
              </div>

              <div v-if="mError" class="modal-err" role="alert">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="#dc2626" stroke-width="1.2"/><path d="M7 4v3.5M7 9.5v.5" stroke="#dc2626" stroke-width="1.2" stroke-linecap="round"/></svg>
                {{ mError }}
              </div>
            </div>

            <div class="modal-foot">
              <button class="btn-cancel" @click="closeModal">Cancelar</button>
              <button class="btn-save" :disabled="mSaving" @click="save">
                <span v-if="!mSaving">Crear vacación ({{ selectedDays.length }} días)</span>
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
            <h3 class="del-title">¿Cancelar vacación?</h3>
            <p class="del-body">Se desactivará este período de vacaciones para <strong>{{ toCancel?.driver?.nombre }}</strong> ({{ toCancel?.days?.length || 0 }} días).</p>
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
  id: number; nombre: string; cedula: string; placa: string | null; diasLaborales: string
}
interface VacationDay {
  id: number; fecha: string; activo: boolean
}
interface VacationItem {
  id: number; driverId: number; fechaInicio: string; fechaFin: string
  motivo: string | null; activo: boolean; days: VacationDay[]
  driver?: { id: number; nombre: string; cedula: string; placa: string | null } | null
}

const vacations = ref<VacationItem[]>([])
const drivers = ref<DriverOpt[]>([])
const loading = ref(false)
const modalOpen = ref(false)
const cancelModal = ref(false)
const cancelling = ref(false)
const mSaving = ref(false)
const mError = ref('')
const toCancel = ref<VacationItem | null>(null)
const selectedDays = ref<string[]>([])
const rangeDays = ref<string[]>([])

const mf = reactive({
  driverId: 0, fechaInicio: '', fechaFin: '', motivo: '',
})
const ferr = reactive({
  driverId: false, fechaInicio: false, fechaFin: false,
})

const AV_BG = ['#1a2540','#2d4a7a','#3a6b8c','#4a5568','#2c5364'] as const
function avBg(name?: string): string {
  const n = name || 'U'
  return AV_BG[n.charCodeAt(0) % AV_BG.length]!
}

const driverOptions = computed(() => drivers.value)

const selectedSet = computed(() => new Set(selectedDays.value))

const calendarOffset = computed(() => {
  if (!rangeDays.value.length) return 0
  const [y, m, d] = rangeDays.value[0]!.split('-').map(Number) as [number, number, number]
  return new Date(y, m - 1, d).getDay()
})

function getDriverDiasLaborales(): string {
  const d = drivers.value.find(d => d.id === mf.driverId)
  return d?.diasLaborales ?? '1,2,3,4,5'
}

function isWorkDay(dateStr: string): boolean {
  const [y, m, d] = dateStr.split('-').map(Number) as [number, number, number]
  const dayNum = new Date(y, m - 1, d).getDay()
  const laboralSet = getDriverDiasLaborales().split(',').map(Number)
  return laboralSet.includes(dayNum)
}

function buildRange() {
  if (!mf.fechaInicio || !mf.fechaFin) {
    rangeDays.value = []
    selectedDays.value = []
    return
  }
  if (mf.fechaInicio > mf.fechaFin) {
    rangeDays.value = []
    selectedDays.value = []
    return
  }
  const [y1, m1, d1] = mf.fechaInicio.split('-').map(Number) as [number, number, number]
  const [y2, m2, d2] = mf.fechaFin.split('-').map(Number) as [number, number, number]
  const start = new Date(y1, m1 - 1, d1)
  const end = new Date(y2, m2 - 1, d2)
  const days: string[] = []
  const cur = new Date(start)
  while (cur <= end) {
    const y = cur.getFullYear()
    const m = String(cur.getMonth() + 1).padStart(2, '0')
    const d = String(cur.getDate()).padStart(2, '0')
    days.push(`${y}-${m}-${d}`)
    cur.setDate(cur.getDate() + 1)
  }
  rangeDays.value = days
  selectedDays.value = days.filter(d => isWorkDay(d))
}

function onDriverChange() {
  buildRange()
}

function onRangeChange() {
  ferr.fechaInicio = !mf.fechaInicio
  ferr.fechaFin = !mf.fechaFin
  buildRange()
}

function toggleDay(dateStr: string) {
  const set = new Set(selectedDays.value)
  if (set.has(dateStr)) set.delete(dateStr)
  else set.add(dateStr)
  selectedDays.value = Array.from(set).sort()
}

async function load() {
  loading.value = true
  try {
    const [vRes, uRes] = await Promise.all([
      api.get<VacationItem[]>('/vacations'),
      api.get<any[]>('/users'),
    ])
    vacations.value = Array.isArray(vRes.data) ? vRes.data : []
    const users = Array.isArray(uRes.data) ? uRes.data : []
    drivers.value = users
      .filter((u: any) => (u.rol === 'CONDUCTOR' || u.rol === 'DRIVER'))
      .map((u: any) => ({ id: u.driver?.id ?? 0, nombre: u.nombre, cedula: u.cedula, placa: u.placa ?? null, diasLaborales: u.driver?.diasLaborales ?? '1,2,3,4,5' }))
      .filter((d: any) => d.id > 0)
  } catch (e: any) {
    console.error('[Vacations] load:', e)
  } finally {
    loading.value = false
  }
}

function openCreate() {
  Object.assign(mf, { driverId: 0, fechaInicio: '', fechaFin: '', motivo: '' })
  Object.assign(ferr, { driverId: false, fechaInicio: false, fechaFin: false })
  selectedDays.value = []
  rangeDays.value = []
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
  ferr.fechaInicio = !mf.fechaInicio
  ferr.fechaFin = !mf.fechaFin

  if (ferr.driverId || ferr.fechaInicio || ferr.fechaFin) {
    mError.value = 'Completa todos los campos obligatorios.'
    return
  }
  if (mf.fechaInicio > mf.fechaFin) {
    mError.value = 'La fecha de inicio debe ser anterior a la fecha de fin.'
    return
  }
  if (!selectedDays.value.length) {
    mError.value = 'Debes seleccionar al menos un día de vacaciones.'
    return
  }

  mSaving.value = true
  try {
    await api.post('/vacations', {
      driverId: mf.driverId,
      fechaInicio: mf.fechaInicio,
      fechaFin: mf.fechaFin,
      motivo: mf.motivo || undefined,
      days: selectedDays.value,
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

function askCancel(v: VacationItem) {
  toCancel.value = v
  cancelModal.value = true
}

async function doCancel() {
  if (!toCancel.value || cancelling.value) return
  cancelling.value = true
  try {
    await api.patch(`/vacations/${toCancel.value.id}/cancel`)
  } catch (e: any) {
    console.error('[Vacations] cancel:', e)
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
.dias-badge { display:inline-block;padding:2px 8px;background:#fef9c3;border:1px solid #fde047;border-radius:4px;font-family:'Barlow Condensed',sans-serif;font-size:11px;font-weight:700;color:#854d0e; }
.dias-tooltip { display:inline-flex;flex-wrap:wrap;gap:3px;margin-left:6px;vertical-align:middle; }
.dias-dot { display:inline-block;padding:1px 5px;border-radius:3px;background:#f2f4f7;font-size:10px;font-weight:600;color:#4a5568;font-family:'Barlow Condensed',sans-serif;letter-spacing:.3px; }

/* Modal */
.modal-overlay { position:fixed;inset:0;background:rgba(0,0,0,.45);backdrop-filter:blur(3px);z-index:500;display:flex;align-items:center;justify-content:center;padding:16px; }
.modal-box { background:#fff;border:1px solid #e4e7ed;border-radius:12px;width:100%;max-width:520px;max-height:92vh;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,.18); }
.modal--wide { max-width:620px; }
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
.ff-input { border:1.5px solid #e4e7ed;border-radius:7px;background:#f8f9fa;padding:10px 12px;font-size:14px;font-family:'Barlow',sans-serif;color:#0d1422;outline:none;transition:all .2s;width:100%;box-sizing:border-box; }
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

/* Calendar */
.cal-section { margin-top:18px;padding-top:16px;border-top:1px solid #eee; }
.cal-header { display:flex;justify-content:space-between;align-items:center;margin-bottom:10px; }
.cal-title { font-family:'Barlow Condensed',sans-serif;font-size:12px;font-weight:700;letter-spacing:.8px;color:#0d1422; }
.cal-count { font-size:11px;font-weight:600;color:#8895a7; }
.cal-grid { display:grid;grid-template-columns:repeat(7,1fr);gap:4px; }
.cal-dow { text-align:center;font-family:'Barlow Condensed',sans-serif;font-size:10px;font-weight:700;color:#8895a7;padding:4px 0; }
.cal-day { position:relative;text-align:center;padding:6px 2px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;transition:all .12s;user-select:none; }
.cal-day--on { background:#1a2540;color:#fff; }
.cal-day--on:hover { background:#0d1422; }
.cal-day--off { background:#f2f4f7;color:#0d1422; }
.cal-day--off:hover { background:#e4e7ed; }
.cal-day--rest { opacity:.45; }
.cal-day--rest.cal-day--on { opacity:1; }
.cal-day--empty { cursor:default;background:transparent;pointer-events:none; }
.cal-day--empty:hover { background:transparent; }
.cal-day-sub { position:absolute;top:-2px;right:-2px;font-size:7px;font-weight:800;color:#e63d2f;background:#fff;border-radius:50%;width:12px;height:12px;display:flex;align-items:center;justify-content:center;border:1px solid #e63d2f; }
.cal-hint { margin-top:8px;font-size:10px;color:#b0bbc9;text-align:center; }
</style>
