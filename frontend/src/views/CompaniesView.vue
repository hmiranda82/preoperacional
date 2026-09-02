<template>
  <div class="page">
    <div class="page-head">
      <div>
        <h1 class="page-title">EMPRESAS</h1>
        <p class="page-sub">Empresa configurada para esta instalación</p>
      </div>
    </div>

    <div class="tcard">
      <div v-if="loading" class="skel-wrap">
        <div v-for="n in 3" :key="n" class="skel-r"></div>
      </div>
      <div v-else-if="!companies.length" class="empty-state">
        <p class="empty-t">Sin empresas registradas</p>
        <p class="empty-s">Crea la primera empresa para comenzar</p>
      </div>
      <table v-else class="tbl">
        <thead>
          <tr>
            <th>#</th>
            <th>EMPRESA</th>
            <th>ESTADO</th>
            <th>CREADA</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(c, i) in companies" :key="c.id" :style="{'--ri': i}">
            <td class="td-mono">{{ c.id }}</td>
            <td class="td-bold">{{ c.nombre }}</td>
            <td>
              <span class="sbadge" :class="c.activo ? 'sb-on' : 'sb-off'">
                {{ c.activo ? 'ACTIVO' : 'INACTIVO' }}
              </span>
            </td>
            <td class="td-mono">{{ fmtDate(c.createdAt) }}</td>
            <td>
              <div class="row-btns">
                <button class="rb-edit" @click="openEdit(c)" title="Editar empresa">
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                    <path d="M8.5 2L11 4.5L4 11.5H1.5v-2.5L8.5 2Z" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
                <button class="rb-del" @click="askDelete(c)" title="Eliminar empresa">
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

    <Teleport to="body">
      <Transition name="modal-t">
        <div v-if="modalOpen" class="modal-overlay" @click.self="closeModal">
          <div class="modal-box modal-sm">
            <h3 class="modal-title" style="text-align:center">Editar empresa</h3>
            <div class="ff" style="margin-bottom:12px">
              <label class="ff-label">Nombre de la empresa <span class="req">*</span></label>
              <input v-model="nombre" class="ff-input" placeholder="Ej: Audifarma S.A.S" @keyup.enter="save" />
            </div>
            <div class="ff" style="margin-bottom:16px">
              <label class="ff-check">
                <input type="checkbox" v-model="activo" />
                <span>Empresa activa</span>
              </label>
            </div>
            <div v-if="mError" class="modal-err">{{ mError }}</div>
            <div class="modal-foot" style="justify-content:center">
              <button class="btn-cancel" @click="closeModal">Cancelar</button>
              <button class="btn-save" :disabled="mSaving" @click="save">
                <span v-if="!mSaving">GUARDAR</span>
                <span v-else class="btn-dots"><span></span><span></span><span></span></span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <Teleport to="body">
      <Transition name="modal-t">
        <div v-if="delModal" class="modal-overlay" @click.self="delModal=false">
          <div class="modal-box modal-sm" style="text-align:center">
            <div style="font-size:46px;margin-bottom:14px;">🗑️</div>
            <h3 class="modal-title" style="text-align:center">¿Eliminar empresa?</h3>
            <p style="font-size:13px;color:#4a5568;margin:0 0 22px;">
              Estás a punto de eliminar <strong>{{ toDelete?.nombre }}</strong>.<br/>
              Esta acción no se puede deshacer.
            </p>
            <div style="display:flex;justify-content:center;gap:9px;">
              <button class="btn-cancel" @click="delModal=false">Cancelar</button>
              <button class="btn-danger" :disabled="deleting" @click="doDelete">Sí, eliminar</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '../api'

interface Company {
  id: number; nombre: string; activo: boolean; createdAt: string
}

const companies = ref<Company[]>([])
const loading = ref(false)
const modalOpen = ref(false)
const editId = ref(0)
const mSaving = ref(false)
const mError = ref('')
const nombre = ref('')
const activo = ref(true)
const delModal = ref(false)
const deleting = ref(false)
const toDelete = ref<Company | null>(null)

async function load() {
  loading.value = true
  try {
    const res = await api.get<Company[]>('/companies')
    companies.value = Array.isArray(res.data) ? res.data : []
  } catch { /* ignore */ }
  finally { loading.value = false }
}

function openEdit(c: Company) {
  editId.value = c.id
  nombre.value = c.nombre
  activo.value = c.activo
  mError.value = ''
  modalOpen.value = true
}

function closeModal() { modalOpen.value = false; mError.value = '' }

async function save() {
  if (!nombre.value.trim()) { mError.value = 'El nombre es obligatorio'; return }
  mSaving.value = true
  try {
    const payload = { nombre: nombre.value.trim(), activo: activo.value }
    await api.put(`/companies/${editId.value}`, payload)
    closeModal()
    await load()
  } catch (e: any) {
    mError.value = e?.response?.data?.message || 'Error al guardar empresa'
  } finally { mSaving.value = false }
}

function askDelete(c: Company) {
  toDelete.value = c
  delModal.value = true
}

async function doDelete() {
  if (!toDelete.value || deleting.value) return
  deleting.value = true
  try {
    await api.delete(`/companies/${toDelete.value.id}`)
    delModal.value = false
    await load()
  } catch (e: any) {
    const msg = e?.response?.data?.message || 'Error al eliminar empresa'
    alert(msg)
    delModal.value = false
  } finally {
    deleting.value = false
  }
}

function fmtDate(d: string) {
  try { return new Date(d).toLocaleDateString('es-CO', { day:'2-digit', month:'short', year:'numeric' }) }
  catch { return d }
}

onMounted(load)
</script>

<style scoped>
.page { font-family:'Barlow',sans-serif; max-width:900px; }
.page-head { display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:20px;gap:12px;flex-wrap:wrap; }
.page-title { font-family:'Barlow Condensed',sans-serif;font-size:30px;font-weight:900;color:#0d1422;margin:0 0 4px;letter-spacing:.5px; }
.page-sub   { font-size:13px;color:#8895a7;margin:0; }
.btn-primary { display:inline-flex;align-items:center;gap:7px;background:#1a2540;color:#fff;border:none;border-radius:7px;padding:10px 18px;font-family:'Barlow Condensed',sans-serif;font-size:13px;font-weight:700;letter-spacing:1px;cursor:pointer;box-shadow:0 3px 12px rgba(26,37,64,.25);transition:background .15s,transform .1s; }
.btn-primary:hover { background:#0d1422;transform:translateY(-1px); }
.tcard { background:#fff;border:1px solid #e4e7ed;border-radius:10px;overflow:hidden; }
.skel-wrap { padding:14px;display:flex;flex-direction:column;gap:8px; }
.skel-r { height:44px;border-radius:7px;background:linear-gradient(90deg,#f2f4f7 25%,#e8eaf0 50%,#f2f4f7 75%);background-size:400% 100%;animation:skel 1.5s infinite; }
@keyframes skel { 0%{background-position:400%0}100%{background-position:-400%0} }
.empty-state { text-align:center;padding:56px; }
.empty-t { font-family:'Barlow Condensed',sans-serif;font-size:18px;font-weight:800;color:#0d1422;margin:0 0 6px; }
.empty-s { font-size:13px;color:#8895a7;margin:0; }
.tbl { width:100%;border-collapse:collapse; }
.tbl th { text-align:left;font-family:'Barlow Condensed',sans-serif;font-size:10px;font-weight:700;letter-spacing:1.2px;color:#8895a7;padding:10px 14px;border-bottom:1px solid #f0f2f6;white-space:nowrap; }
.tbl td { padding:11px 14px;font-size:13px;color:#0d1422;border-bottom:1px solid #f5f7fa; }
.td-mono { font-size:12px;color:#4a5568;font-variant-numeric:tabular-nums; }
.td-bold { font-weight:600; }
.sbadge { display:inline-flex;align-items:center;gap:5px;font-family:'Barlow Condensed',sans-serif;font-size:10px;font-weight:700;letter-spacing:.8px;padding:3px 9px;border-radius:4px; }
.sbadge::before { content:'';width:5px;height:5px;border-radius:50%;background:currentColor; }
.sb-on  { background:#f0fdf4;color:#166534; }
.sb-off { background:#f9fafb;color:#6b7280;border:1px solid #e5e7eb; }
.row-btns { display:flex;gap:4px; }
.rb-edit,.rb-del { width:28px;height:28px;border-radius:6px;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .15s; }
.rb-edit { background:rgba(26,37,64,.07);color:#1a2540; } .rb-edit:hover { background:rgba(26,37,64,.14); }
.rb-del  { background:rgba(230,61,47,.07);color:#e63d2f; } .rb-del:hover  { background:rgba(230,61,47,.14); }
.modal-overlay { position:fixed;inset:0;background:rgba(0,0,0,.45);backdrop-filter:blur(3px);z-index:500;display:flex;align-items:center;justify-content:center;padding:16px; }
.modal-box { background:#fff;border:1px solid #e4e7ed;border-radius:12px;width:100%;max-width:400px;padding:28px 24px;box-shadow:0 20px 60px rgba(0,0,0,.18); }
.modal-title { font-family:'Barlow Condensed',sans-serif;font-size:18px;font-weight:800;color:#0d1422;margin:0 0 18px; }
.ff { display:flex;flex-direction:column;gap:5px; }
.ff-label { font-family:'Barlow Condensed',sans-serif;font-size:10px;font-weight:700;letter-spacing:1.2px;color:#4a5568; }
.req { color:#e63d2f; }
.ff-input { border:1.5px solid #e4e7ed;border-radius:7px;background:#f8f9fa;padding:10px 12px;font-size:14px;font-family:'Barlow',sans-serif;color:#0d1422;outline:none;transition:all .2s;width:100%; }
.ff-input:focus { border-color:#1a2540;background:#fff;box-shadow:0 0 0 3px rgba(26,37,64,.08); }
.ff-check { display:flex;align-items:center;gap:8px;font-size:13px;color:#0d1422;cursor:pointer; }
.ff-check input[type="checkbox"] { width:16px;height:16px;accent-color:#1a2540;cursor:pointer; }
.modal-err { background:#fef2f2;border:1px solid #fecaca;border-radius:7px;padding:10px 13px;font-size:13px;color:#dc2626;margin-bottom:12px; }
.modal-foot { display:flex;justify-content:flex-end;gap:9px; }
.btn-cancel { padding:9px 18px;border-radius:7px;border:1.5px solid #e4e7ed;background:#fff;color:#4a5568;font-size:13px;font-weight:600;font-family:'Barlow',sans-serif;cursor:pointer; }
.btn-cancel:hover { background:#f2f4f7; }
.btn-save { padding:9px 20px;border-radius:7px;background:#1a2540;color:#fff;border:none;font-family:'Barlow Condensed',sans-serif;font-size:14px;font-weight:700;letter-spacing:.5px;cursor:pointer;min-width:90px;display:flex;align-items:center;justify-content:center; }
.btn-save:hover { background:#0d1422; }
.btn-save:disabled { opacity:.65;cursor:not-allowed; }
.btn-danger { padding:9px 20px;border-radius:7px;background:#e63d2f;color:#fff;border:none;font-family:'Barlow Condensed',sans-serif;font-size:14px;font-weight:700;letter-spacing:.5px;cursor:pointer; }
.btn-danger:hover { background:#c42d20; }
.btn-dots { display:flex;gap:4px; }
.btn-dots span { width:5px;height:5px;border-radius:50%;background:rgba(255,255,255,.8);animation:bd .7s infinite; }
.btn-dots span:nth-child(2){animation-delay:.12s}.btn-dots span:nth-child(3){animation-delay:.24s}
@keyframes bd{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-5px)}}
.modal-t-enter-active { animation:mIn .22s cubic-bezier(.22,1,.36,1); }
.modal-t-leave-active { animation:mIn .16s ease reverse; }
@keyframes mIn { from{opacity:0;transform:scale(.95)}to{opacity:1;transform:scale(1)} }
</style>
