<template>
  <div class="page">

    <!-- Header -->
    <div class="page-head">
      <div>
        <h1 class="page-title">PREGUNTAS</h1>
        <p class="page-sub">Gestiona el cuestionario de inspecciones preoperacionales</p>
      </div>
      <button class="btn-primary" @click="openCreate">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M7 1v12M1 7h12" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
        </svg>
        NUEVA PREGUNTA
      </button>
    </div>

    <!-- Filtros -->
    <div class="filter-bar">
      <div class="search-box" :class="{'sfocus': sfocus}">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="6" cy="6" r="4.5" stroke="currentColor" stroke-width="1.3"/><path d="M9.5 9.5L13 13" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
        <input v-model="search" placeholder="Buscar pregunta…" @focus="sfocus=true" @blur="sfocus=false"/>
      </div>
      <div class="chips">
        <button v-for="c in CATEGORIAS" :key="c.val" class="chip" :class="{'chip--on': catF===c.val}" @click="catF=c.val">{{ c.lbl }}</button>
      </div>
      <div class="chips">
        <button v-for="t in TIPOS" :key="t.val" class="chip chip--sm" :class="{'chip--on': tipoF===t.val}" @click="tipoF=t.val">{{ t.lbl }}</button>
      </div>
      <div class="chips">
        <button class="chip chip--sm" :class="{'chip--on': activeF===null}" @click="activeF=null">Todas</button>
        <button class="chip chip--sm" :class="{'chip--on': activeF===true}" @click="activeF=true">Activas</button>
        <button class="chip chip--sm" :class="{'chip--on': activeF===false}" @click="activeF=false">Inactivas</button>
      </div>
    </div>

    <!-- Form selector -->
    <div class="form-selector" v-if="forms.length > 1">
      <label class="fs-label">Formulario:</label>
      <div class="sel-wrap">
        <select v-model.number="selectedFormId" class="ff-input" @change="load">
          <option v-for="f in forms" :key="f.id" :value="f.id">{{ f.nombre }}</option>
        </select>
        <svg class="sel-arr" width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 4.5l3 3 3-3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </div>
    </div>

    <!-- Tabla -->
    <div class="tcard">
      <div v-if="loading" class="skel-wrap">
        <div v-for="n in 6" :key="n" class="skel-r"></div>
      </div>

      <div v-else-if="!filtered.length" class="empty-state">
        <svg width="52" height="52" viewBox="0 0 52 52" fill="none"><rect x="8" y="4" width="36" height="44" rx="4" stroke="#d4d9e3" stroke-width="2"/><path d="M16 16h20M16 24h20M16 32h12" stroke="#d4d9e3" stroke-width="2" stroke-linecap="round"/></svg>
        <p class="empty-t">Sin preguntas</p>
        <p class="empty-s">Crea la primera pregunta del cuestionario</p>
      </div>

      <table v-else class="tbl">
        <thead>
          <tr>
            <th style="width:60px">ORD.</th>
            <th>PREGUNTA</th>
            <th>CATEGORÍA</th>
            <th>TIPO</th>
            <th>ESTADO</th>
            <th style="width:110px">ACCIONES</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(q, i) in filtered" :key="q.id" :style="{'--ri': i}">
            <td class="td-ord">{{ q.orden }}</td>
            <td class="td-texto">{{ q.texto }}</td>
            <td>
              <span class="cat-badge" :class="'cat-' + q.categoria.toLowerCase()">
                {{ CATEGORIA_MAP[q.categoria] || q.categoria }}
              </span>
            </td>
            <td>
              <span class="tipo-badge">{{ TIPO_MAP[q.tipo] || q.tipo }}</span>
            </td>
            <td>
              <!-- Toggle activo/inactivo -->
              <button
                class="toggle-btn"
                :class="q.activo ? 'toggle-on' : 'toggle-off'"
                @click="toggleActivo(q)"
                :title="q.activo ? 'Desactivar' : 'Activar'"
              >
                <span class="toggle-dot"></span>
                {{ q.activo ? 'ACTIVA' : 'INACTIVA' }}
              </button>
            </td>
            <td>
              <div class="action-btns">
                <button
                  class="act-btn act-edit"
                  @click.stop="openEdit(q)"
                  title="Editar pregunta"
                  type="button"
                >
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                    <path d="M8.5 2L11 4.5L4 11.5H1.5v-2.5L8.5 2Z" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
                <button
                  class="act-btn act-del"
                  @click.stop="confirmDelete(q)"
                  title="Eliminar pregunta"
                  type="button"
                >
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                    <path d="M2 3.5h9M4.5 3.5V2.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v1M10 3.5l-.7 7a.9.9 0 0 1-.9.8H4.6a.9.9 0 0 1-.9-.8L3 3.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
                  </svg>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- MODAL CREAR / EDITAR -->
    <Teleport to="body">
      <Transition name="modal-t">
        <div v-if="dialog" class="modal-overlay" @click.self="dialog=false">
          <div class="modal-box">

            <div class="modal-head">
              <div class="modal-icon" :class="editingId ? 'mi-edit' : 'mi-new'">
                <svg v-if="!editingId" width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="2" width="14" height="14" rx="3" stroke="currentColor" stroke-width="1.5"/><path d="M9 5v8M5 9h8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                <svg v-else width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M12.5 2.5l3 3L6 15H3v-3L12.5 2.5Z" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </div>
              <div>
                <h3 class="modal-title">{{ editingId ? 'Editar pregunta' : 'Nueva pregunta' }}</h3>
                <p class="modal-sub">{{ editingId ? 'Modifica el contenido de la pregunta' : 'Define la nueva pregunta del cuestionario' }}</p>
              </div>
              <button class="modal-close" @click="dialog=false" type="button">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 2.5l9 9M11.5 2.5l-9 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
              </button>
            </div>

            <div class="modal-body">

              <!-- Error -->
              <div v-if="formErr" class="modal-err" role="alert">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="#dc2626" stroke-width="1.2"/><path d="M7 4v3.5M7 9.5v.5" stroke="#dc2626" stroke-width="1.2" stroke-linecap="round"/></svg>
                {{ formErr }}
              </div>

              <!-- Texto -->
              <div class="ff ff--full">
                <label class="ff-label">Texto de la pregunta <span class="req">*</span></label>
                <textarea
                  v-model="form.texto"
                  class="ff-textarea"
                  :class="{'ff-textarea--err': !form.texto.trim() && formErr}"
                  rows="3"
                  placeholder="Ej: ¿Los frenos del vehículo están en buen estado?"
                  @input="formErr=''"
                ></textarea>
              </div>

              <div class="form-grid">
                <!-- Categoría -->
                <div class="ff">
                  <label class="ff-label">Categoría</label>
                  <div class="sel-wrap">
                    <select v-model="form.categoria" class="ff-input">
                      <option v-for="c in CATEGORIAS_FORM" :key="c.val" :value="c.val">{{ c.lbl }}</option>
                    </select>
                    <svg class="sel-arr" width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 4.5l3 3 3-3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  </div>
                </div>

                <!-- Tipo -->
                <div class="ff">
                  <label class="ff-label">Tipo de respuesta</label>
                  <div class="sel-wrap">
                    <select v-model="form.tipo" class="ff-input">
                      <option v-for="t in TIPOS_FORM" :key="t.val" :value="t.val">{{ t.lbl }}</option>
                    </select>
                    <svg class="sel-arr" width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 4.5l3 3 3-3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  </div>
                </div>

                <!-- Orden -->
                <div class="ff">
                  <label class="ff-label">Orden de aparición</label>
                  <input
                    v-model.number="form.orden"
                    type="number"
                    min="0"
                    max="999"
                    class="ff-input"
                    @input="form.orden = Math.max(0, Math.min(999, Number(form.orden)))"
                  />
                </div>

                <!-- Formulario -->
                <div class="ff">
                  <label class="ff-label">Formulario</label>
                  <div class="sel-wrap">
                    <select v-model.number="form.formId" class="ff-input">
                      <option v-for="f in forms" :key="f.id" :value="f.id">{{ f.nombre }}</option>
                    </select>
                    <svg class="sel-arr" width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 4.5l3 3 3-3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  </div>
                </div>
              </div>

              <!-- Preview del tipo seleccionado -->
              <div class="tipo-preview">
                <p class="tp-label">VISTA PREVIA DEL TIPO:</p>
                <div class="tp-content">
                  <div v-if="form.tipo === 'BOOLEAN'" class="tp-bool">
                    <span class="tp-btn tp-bueno">✓ BUENO</span>
                    <span class="tp-btn tp-malo">✗ MALO</span>
                    <div class="tp-obs-hint">+ campo observación opcional</div>
                  </div>
                  <div v-else-if="form.tipo === 'SINO'" class="tp-bool">
                    <span class="tp-btn tp-bueno">✓ SÍ</span>
                    <span class="tp-btn tp-malo">✗ NO</span>
                    <div class="tp-obs-hint">+ campo observación opcional</div>
                  </div>
                  <div v-else-if="form.tipo === 'TEXTO'" class="tp-text-hint">Campo de texto libre</div>
                  <div v-else-if="form.tipo === 'NUMERO'" class="tp-text-hint">Campo numérico (ej: 150, 3.5)</div>
                </div>
              </div>

            </div>

            <div class="modal-foot">
              <button class="btn-cancel" @click="dialog=false" type="button">Cancelar</button>
              <button class="btn-save" :disabled="saving" @click="save" type="button">
                <span v-if="!saving">{{ editingId ? 'Guardar cambios' : 'Crear pregunta' }}</span>
                <span v-else class="btn-dots"><span></span><span></span><span></span></span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- MODAL ELIMINAR -->
    <Teleport to="body">
      <Transition name="modal-t">
        <div v-if="deleteDialog" class="modal-overlay" @click.self="deleteDialog=false">
          <div class="modal-box modal-sm">
            <div class="del-icon">🗑️</div>
            <h3 class="del-title">¿Eliminar pregunta?</h3>
            <p class="del-body">
              Esta acción es irreversible. Las respuestas existentes asociadas a esta pregunta también se eliminarán.
            </p>
            <div class="del-actions">
              <button class="btn-cancel" @click="deleteDialog=false" type="button">Cancelar</button>
              <button class="btn-danger" :disabled="deleting" @click="deleteQuestion" type="button">
                <span v-if="!deleting">Sí, eliminar</span>
                <span v-else class="btn-dots"><span></span><span></span><span></span></span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import api from '../api'

/* ── Types ──────────────────────────────────────── */
interface Question {
  id:        number
  formId:    number
  texto:     string
  tipo:      string
  categoria: string
  orden:     number
  activo:    boolean
}

/* ── Constants ──────────────────────────────────── */
// Chips de filtro (incluye ALL para "mostrar todo")
// Filtros de categoría (chips superiores)
const CATEGORIAS = [
  { val: 'ALL',       lbl: 'Todas'     },
  { val: 'TODOS',     lbl: 'General'   },
  { val: 'VEHICULO',  lbl: 'Vehículo'  },
  { val: 'MOTO',      lbl: 'Moto'      },
  { val: 'CONDUCTOR', lbl: 'Conductor' },
]

// Opciones del dropdown en el formulario (sin ALL)
const CATEGORIAS_FORM = CATEGORIAS.filter(c => c.val !== 'ALL')

// Filtros de tipo (chips) — sin Imagen
const TIPOS = [
  { val: 'ALL',     lbl: 'Todos'      },
  { val: 'BOOLEAN', lbl: 'Bueno/Malo' },
  { val: 'SINO',    lbl: 'Sí/No'      },
  { val: 'TEXTO',   lbl: 'Texto'      },
  { val: 'NUMERO',  lbl: 'Número'     },
]

// Opciones del dropdown en el formulario (sin ALL)
const TIPOS_FORM = TIPOS.filter(t => t.val !== 'ALL')

const CATEGORIA_MAP: Record<string, string> = {
  TODOS: 'General', VEHICULO: 'Vehículo',
  MOTO: 'Moto', CONDUCTOR: 'Conductor',
}
// FIX: eliminado 'IMAGEN' — no existe como tipo en backend/BD.
// Las fotos adjuntas van en answer.imagenUrl, no en question.tipo.
const TIPO_MAP: Record<string, string> = {
  BOOLEAN: 'Bueno/Malo',
  SINO:    'Sí/No',
  TEXTO:   'Texto',
  NUMERO:  'Número',
}

/* ── State ──────────────────────────────────────── */
const questions   = ref<Question[]>([])
const loading     = ref(false)
const saving      = ref(false)
const deleting    = ref(false)
const dialog      = ref(false)
const deleteDialog = ref(false)
const editingId   = ref<number | null>(null)
const deletingId  = ref<number | null>(null)
const formErr     = ref('')
const search      = ref('')
const sfocus      = ref(false)
const catF        = ref('ALL')
const tipoF       = ref('ALL')
const activeF     = ref<boolean | null>(null)
const forms         = ref<{ id: number; nombre: string }[]>([])
const selectedFormId = ref<number | null>(null)

const form = reactive({
  texto:     '',
  tipo:      'BOOLEAN',
  categoria: 'TODOS',
  orden:     0,
  formId:    1,
})

/* ── Computed ───────────────────────────────────── */
const filtered = computed(() => {
  const q = search.value.toLowerCase()
  return questions.value.filter(item => {
    if (catF.value  !== 'ALL' && item.categoria !== catF.value)  return false
    if (tipoF.value !== 'ALL' && item.tipo      !== tipoF.value) return false
    if (activeF.value !== null && item.activo !== activeF.value) return false
    if (q && !item.texto.toLowerCase().includes(q))              return false
    return true
  })
})

/* ── Modal handlers ─────────────────────────────── */
function openCreate() {
  editingId.value = null
  Object.assign(form, { texto: '', tipo: 'BOOLEAN', categoria: 'TODOS', orden: 0, formId: 1 })
  formErr.value = ''
  dialog.value  = true
}

function openEdit(item: Question) {
  editingId.value = item.id
  Object.assign(form, {
    texto:     item.texto,
    tipo:      item.tipo,
    categoria: item.categoria,
    orden:     item.orden,
    formId:    item.formId,
  })
  formErr.value = ''
  dialog.value  = true
}

function confirmDelete(item: Question) {
  deletingId.value  = item.id
  deleteDialog.value = true
}

/* ── API actions ────────────────────────────────── */
async function toggleActivo(item: Question) {
  try {
    await api.patch(`/questions/${item.id}/toggle`)
    await load()
  } catch (e: any) {
    console.error('[Questions] toggle error:', e)
  }
}

async function save() {
  if (!form.texto.trim()) {
    formErr.value = 'El texto de la pregunta es obligatorio'
    return
  }
  saving.value  = true
  formErr.value = ''
  try {
    if (editingId.value) {
      // formId no existe en UpdateQuestionDto — solo enviamos los campos editables
      const { formId: _fid, ...updatePayload } = form as any
      await api.put(`/questions/${editingId.value}`, updatePayload)
    } else {
      await api.post('/questions', { ...form })
    }
    dialog.value = false
    await load()
  } catch (e: any) {
    const msg = e?.response?.data?.message
    formErr.value = Array.isArray(msg) ? msg[0] : (msg || 'Error al guardar')
  } finally {
    saving.value = false
  }
}

async function deleteQuestion() {
  if (!deletingId.value) return
  deleting.value = true
  try {
    await api.delete(`/questions/${deletingId.value}`)
  } catch (e: any) {
    const status = e?.response?.status
    if (status !== 204 && status !== 200) {
      console.error('[Questions] delete error:', e)
      return
    }
  } finally {
    deleteDialog.value = false
    deleting.value     = false
    await load()
  }
}

async function load() {
  loading.value = true
  try {
    const [fRes] = await Promise.all([
      api.get<{ id: number; nombre: string }[]>('/forms'),
    ])
    forms.value = Array.isArray(fRes.data) ? fRes.data : []

    if (!selectedFormId.value && forms.value.length) {
      selectedFormId.value = forms.value[0]!.id
    }
    if (forms.value.length && form.formId === 1) {
      form.formId = forms.value[0]!.id
    }

    const params = selectedFormId.value ? { formId: selectedFormId.value } : {}
    const qRes = await api.get<any[]>('/questions', { params })
    questions.value = Array.isArray(qRes.data) ? qRes.data : []
  } catch (e: any) {
    console.error('[Questions] load error:', e)
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=Barlow:wght@400;500;600;700&display=swap');
.page { font-family:'Barlow',sans-serif; max-width:1400px; }

/* Header */
.page-head { display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:20px;gap:12px;flex-wrap:wrap; }
.page-title { font-family:'Barlow Condensed',sans-serif;font-size:30px;font-weight:900;color:#0d1422;margin:0 0 4px;letter-spacing:.5px; }
.page-sub   { font-size:13px;color:#8895a7;margin:0; }
.btn-primary { display:inline-flex;align-items:center;gap:7px;background:#1a2540;color:#fff;border:none;border-radius:7px;padding:10px 18px;font-family:'Barlow Condensed',sans-serif;font-size:13px;font-weight:700;letter-spacing:1px;cursor:pointer;box-shadow:0 3px 12px rgba(26,37,64,.25);transition:background .15s,transform .1s; }
.btn-primary:hover { background:#0d1422;transform:translateY(-1px); }

/* Filters */
.filter-bar { display:flex;align-items:center;gap:8px;margin-bottom:14px;flex-wrap:wrap; }
.search-box { display:flex;align-items:center;gap:8px;background:#fff;border:1.5px solid #e4e7ed;border-radius:7px;padding:9px 13px;min-width:200px;color:#8895a7;transition:border-color .2s; }
.sfocus { border-color:#1a2540; }
.search-box input { border:none;outline:none;background:none;font-size:14px;font-family:'Barlow',sans-serif;color:#0d1422;width:160px; }
.search-box input::placeholder { color:#b0bbc9; }
.chips { display:flex;gap:5px;flex-wrap:wrap; }
.chip { padding:6px 12px;border-radius:6px;font-family:'Barlow Condensed',sans-serif;font-size:12px;font-weight:700;letter-spacing:.5px;cursor:pointer;border:1.5px solid #e4e7ed;background:#fff;color:#4a5568;transition:all .15s; }
.chip--sm { padding:5px 10px;font-size:11px; }
.chip--on { background:#1a2540;border-color:#1a2540;color:#fff; }

/* Form selector */
.form-selector { display:flex;align-items:center;gap:8px;margin-bottom:10px; }
.fs-label { font-family:'Barlow Condensed',sans-serif;font-size:12px;font-weight:700;letter-spacing:.8px;color:#4a5568;white-space:nowrap; }
.form-selector .sel-wrap { width:280px; }

/* Table */
.tcard { background:#fff;border:1px solid #e4e7ed;border-radius:10px;overflow:hidden; }
.skel-wrap { padding:14px;display:flex;flex-direction:column;gap:8px; }
.skel-r { height:44px;border-radius:7px;background:linear-gradient(90deg,#f2f4f7 25%,#e8eaf0 50%,#f2f4f7 75%);background-size:400% 100%;animation:skel 1.5s infinite; }
@keyframes skel { 0%{background-position:400%0}100%{background-position:-400%0} }
.empty-state { text-align:center;padding:56px;display:flex;flex-direction:column;align-items:center;gap:10px; }
.empty-t { font-family:'Barlow Condensed',sans-serif;font-size:18px;font-weight:800;color:#0d1422;margin:0; }
.empty-s { font-size:13px;color:#8895a7;margin:0; }

.tbl { width:100%;border-collapse:collapse; }
.tbl th { text-align:left;font-family:'Barlow Condensed',sans-serif;font-size:10px;font-weight:700;letter-spacing:1.2px;color:#8895a7;padding:10px 14px;border-bottom:1px solid #f0f2f6;white-space:nowrap; }
.tbl tbody tr { border-bottom:1px solid #f5f7fa;animation:rIn .3s ease calc(var(--ri,0)*.04s) both;transition:background .1s; }
.tbl tbody tr:last-child { border-bottom:none; }
.tbl tbody tr:hover { background:#fafbfc; }
.tbl td { padding:11px 14px;vertical-align:middle;font-size:13px;color:#0d1422; }
@keyframes rIn { from{opacity:0;transform:translateX(-5px)}to{opacity:1;transform:translateX(0)} }

.td-ord   { font-family:'Barlow Condensed',sans-serif;font-size:14px;font-weight:800;color:#1a2540;text-align:center; }
.td-texto { font-size:13px;color:#0d1422;line-height:1.45;max-width:380px; }

/* Badges */
.cat-badge { font-family:'Barlow Condensed',sans-serif;font-size:10px;font-weight:700;letter-spacing:.8px;padding:3px 9px;border-radius:4px; }
.cat-todos     { background:#f2f4f7;color:#4a5568; }
.cat-vehiculo  { background:#eff6ff;color:#1d4ed8; }
.cat-moto      { background:#fff7ed;color:#c2410c; }
.cat-bicicleta { background:#f0fdf4;color:#166534; }
.cat-conductor { background:#faf5ff;color:#7e22ce; }

.tipo-badge { font-family:'Barlow Condensed',sans-serif;font-size:10px;font-weight:700;letter-spacing:.8px;padding:3px 9px;border-radius:4px;background:#1a2540;color:#fff; }

/* Toggle switch */
.toggle-btn { display:inline-flex;align-items:center;gap:5px;font-family:'Barlow Condensed',sans-serif;font-size:10px;font-weight:700;letter-spacing:.8px;padding:4px 10px;border-radius:4px;border:none;cursor:pointer;transition:all .15s; }
.toggle-on  { background:#f0fdf4;color:#166534; }
.toggle-off { background:#f9fafb;color:#6b7280;border:1px solid #e5e7eb; }
.toggle-dot { width:5px;height:5px;border-radius:50%;background:currentColor; }

/* Action buttons — identical to UsersView */
.action-btns { display:flex;gap:4px; }
.act-btn { width:28px;height:28px;border-radius:6px;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .15s; }
.act-edit { background:rgba(26,37,64,.07);color:#1a2540; } .act-edit:hover { background:rgba(26,37,64,.14); }
.act-del  { background:rgba(230,61,47,.07);color:#e63d2f; } .act-del:hover  { background:rgba(230,61,47,.14); }

/* Modal */
.modal-overlay { position:fixed;inset:0;background:rgba(0,0,0,.45);backdrop-filter:blur(3px);z-index:500;display:flex;align-items:center;justify-content:center;padding:16px; }
.modal-box { background:#fff;border:1px solid #e4e7ed;border-radius:12px;width:100%;max-width:540px;max-height:90vh;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,.18); }
.modal-sm  { max-width:360px;text-align:center;padding:32px 28px; }

.modal-head { display:flex;align-items:flex-start;gap:12px;padding:20px 22px 16px;border-bottom:1px solid #f0f2f6;flex-shrink:0; }
.modal-icon { width:40px;height:40px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0; }
.mi-new  { background:#f0f4f8;color:#1a2540; }
.mi-edit { background:#fff8f0;color:#c2830a; }
.modal-title { font-family:'Barlow Condensed',sans-serif;font-size:16px;font-weight:800;color:#0d1422;margin:0 0 2px;letter-spacing:.3px; }
.modal-sub   { font-size:12px;color:#8895a7;margin:0; }
.modal-close { margin-left:auto;background:none;border:none;cursor:pointer;color:#8895a7;display:flex;padding:6px;border-radius:7px;transition:background .15s;flex-shrink:0; }
.modal-close:hover { background:#f2f4f7; }

.modal-body { padding:18px 22px;overflow-y:auto;flex:1; }
.form-grid  { display:grid;grid-template-columns:1fr 1fr;gap:13px;margin-top:14px; }

.ff { display:flex;flex-direction:column;gap:5px; }
.ff--full { margin-bottom:0; }
.ff-label { font-family:'Barlow Condensed',sans-serif;font-size:10px;font-weight:700;letter-spacing:1.2px;color:#4a5568; }
.req { color:#e63d2f; }
.ff-input {
  border:1.5px solid #e4e7ed;border-radius:7px;background:#f8f9fa;
  padding:10px 12px;font-size:14px;font-family:'Barlow',sans-serif;
  color:#0d1422;outline:none;transition:all .2s;width:100%;
}
.ff-input:focus { border-color:#1a2540;background:#fff;box-shadow:0 0 0 3px rgba(26,37,64,.08); }
.ff-textarea {
  border:1.5px solid #e4e7ed;border-radius:7px;background:#f8f9fa;
  padding:10px 12px;font-size:14px;font-family:'Barlow',sans-serif;
  color:#0d1422;outline:none;resize:vertical;width:100%;transition:all .2s;
}
.ff-textarea:focus { border-color:#1a2540;background:#fff;box-shadow:0 0 0 3px rgba(26,37,64,.08); }
.ff-textarea--err { border-color:#e63d2f; }
.sel-wrap { position:relative; }
.sel-wrap .ff-input { appearance:none;padding-right:28px;cursor:pointer; }
.sel-arr { position:absolute;right:10px;top:50%;transform:translateY(-50%);pointer-events:none;color:#8895a7; }

.modal-err { display:flex;align-items:flex-start;gap:8px;background:#fef2f2;border:1px solid #fecaca;border-radius:7px;padding:10px 13px;font-size:13px;color:#dc2626;margin-bottom:14px; }

/* Tipo preview */
.tipo-preview { margin-top:16px;padding:12px 14px;background:#f8f9fa;border:1px solid #e4e7ed;border-radius:8px; }
.tp-label { font-family:'Barlow Condensed',sans-serif;font-size:10px;font-weight:700;letter-spacing:1px;color:#8895a7;margin:0 0 8px; }
.tp-content { font-size:13px;color:#4a5568; }
.tp-bool { display:flex;align-items:center;gap:8px;flex-wrap:wrap; }
.tp-btn { font-family:'Barlow Condensed',sans-serif;font-size:12px;font-weight:700;padding:5px 14px;border-radius:5px;letter-spacing:.5px; }
.tp-bueno { background:#f0f8f4;border:1.5px solid #27ae60;color:#27ae60; }
.tp-malo  { background:#fdf3f3;border:1.5px solid #e63d2f;color:#e63d2f; }
.tp-obs-hint { font-size:11px;color:#8895a7;width:100%; }
.tp-text-hint { font-size:13px;color:#4a5568;font-style:italic; }

.modal-foot { display:flex;justify-content:flex-end;gap:9px;padding:14px 22px;border-top:1px solid #f0f2f6;flex-shrink:0; }
.btn-cancel { padding:9px 18px;border-radius:7px;border:1.5px solid #e4e7ed;background:#fff;color:#4a5568;font-size:13px;font-weight:600;font-family:'Barlow',sans-serif;cursor:pointer;transition:all .15s; }
.btn-cancel:hover { background:#f2f4f7; }
.btn-save { padding:9px 20px;border-radius:7px;background:#1a2540;color:#fff;border:none;font-family:'Barlow Condensed',sans-serif;font-size:14px;font-weight:700;letter-spacing:.5px;cursor:pointer;min-width:130px;display:flex;align-items:center;justify-content:center;transition:background .15s; }
.btn-save:hover { background:#0d1422; }
.btn-save:disabled { opacity:.65;cursor:not-allowed; }
.btn-danger { padding:9px 20px;border-radius:7px;background:#e63d2f;color:#fff;border:none;font-family:'Barlow Condensed',sans-serif;font-size:14px;font-weight:700;letter-spacing:.5px;cursor:pointer;display:flex;align-items:center;justify-content:center;min-width:110px;transition:background .15s; }
.btn-danger:hover { background:#c42d20; }
.btn-danger:disabled { opacity:.65;cursor:not-allowed; }
.btn-dots { display:flex;gap:4px;height:18px;align-items:center; }
.btn-dots span { width:5px;height:5px;border-radius:50%;background:rgba(255,255,255,.8);animation:bd .7s infinite; }
.btn-dots span:nth-child(2){animation-delay:.12s}.btn-dots span:nth-child(3){animation-delay:.24s}
@keyframes bd{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-5px)}}
.del-icon  { font-size:46px;margin-bottom:14px; }
.del-title { font-family:'Barlow Condensed',sans-serif;font-size:20px;font-weight:900;color:#0d1422;margin:0 0 8px;letter-spacing:.3px; }
.del-body  { font-size:13px;color:#4a5568;line-height:1.6;margin:0 0 22px; }
.del-actions { display:flex;justify-content:center;gap:9px; }

.modal-t-enter-active { animation:mIn .22s cubic-bezier(.22,1,.36,1); }
.modal-t-leave-active { animation:mIn .16s ease reverse; }
@keyframes mIn { from{opacity:0;transform:scale(.95)}to{opacity:1;transform:scale(1)} }
</style>