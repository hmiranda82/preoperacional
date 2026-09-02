<template>
  <v-container fluid class="pa-6">
    <div class="d-flex align-center justify-space-between mb-6">
      <h2 class="text-h5 font-weight-bold">Respuestas</h2>
      <v-btn
        color="success"
        prepend-icon="mdi-microsoft-excel"
        :loading="exporting"
        @click="exportExcel"
        style="color:#fff"
      >
        Exportar Excel
      </v-btn>
    </div>

    <!-- Filtros -->
    <v-card rounded="lg" class="mb-4 pa-4">
      <v-row density="comfortable">
        <v-col cols="12" md="4">
          <v-text-field
            v-model="search"
            prepend-inner-icon="mdi-magnify"
            placeholder="Buscar conductor, placa, cédula..."
            variant="outlined"
            density="compact"
            hide-details
            clearable
          />
        </v-col>
        <v-col cols="12" md="3">
          <v-text-field
            v-model="fechaDesde"
            label="Desde"
            type="date"
            variant="outlined"
            density="compact"
            hide-details
          />
        </v-col>
        <v-col cols="12" md="3">
          <v-text-field
            v-model="fechaHasta"
            label="Hasta"
            type="date"
            variant="outlined"
            density="compact"
            hide-details
          />
        </v-col>
        <v-col cols="12" md="2">
          <v-btn block variant="tonal" @click="clearFilters">Limpiar</v-btn>
        </v-col>
      </v-row>
    </v-card>

    <v-card rounded="lg">
      <v-data-table
        :headers="headers"
        :items="filteredResponses"
        :loading="loading"
        items-per-page="10"
        class="elevation-0"
      >
        <template #item.fecha="{ item }">
          {{ formatDate(item.fecha) }}
        </template>
        <template #item.estado="{ item }">
          <v-chip size="small" :color="getEstado(item.answers).color" variant="tonal">
            {{ getEstado(item.answers).label }}
          </v-chip>
        </template>
        <template #item.actions="{ item }">
          <v-btn icon="mdi-eye" size="small" variant="text" @click="viewDetail(item)" />
        </template>
      </v-data-table>
    </v-card>

    <!-- Detail dialog -->
    <v-dialog v-model="dialog" max-width="700">
      <v-card v-if="selected" rounded="lg">
        <v-card-title class="pa-4 d-flex justify-space-between align-center">
          Detalle de inspección #{{ selected.id }}
          <v-btn icon="mdi-close" variant="text" @click="dialog = false" />
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-4">
          <v-row density="comfortable" class="mb-4">
            <v-col cols="6"><strong>Conductor:</strong> {{ selected.user?.nombre }}</v-col>
            <v-col cols="6"><strong>Cédula:</strong> {{ selected.user?.cedula }}</v-col>
            <v-col cols="6"><strong>Placa:</strong> {{ selected.placa }}</v-col>
            <v-col cols="6"><strong>Ciudad:</strong> {{ selected.ciudad }}</v-col>
            <v-col cols="6"><strong>Contrato:</strong> {{ selected.contrato }}</v-col>
            <v-col cols="6"><strong>Fecha:</strong> {{ formatDate(selected.fecha) }}</v-col>
          </v-row>

          <!-- Foto del vehículo -->
          <div v-if="selected.imagenVehiculoUrl" class="mb-4 mt-2">
            <p class="text-caption text-medium-emphasis font-weight-medium mb-2">
              <v-icon size="14" class="mr-1">mdi-camera</v-icon>
              Foto del vehículo
            </p>
            <a :href="uploadUrl(selected.imagenVehiculoUrl)" target="_blank" rel="noopener noreferrer"
              class="d-inline-block" style="text-decoration:none">
              <img
                :src="uploadUrl(selected.imagenVehiculoUrl)"
                alt="Foto del vehículo"
                class="answer-img"
                style="max-width:100%; max-height:240px; display:block;"
                @error="(e) => ((e.target as HTMLImageElement).style.display = 'none')"
              />
              <span class="img-caption">📷 Ver foto completa</span>
            </a>
          </div>

          <v-divider class="mb-4" />

          <v-list density="compact">
            <v-list-item
              v-for="answer in selected.answers"
              :key="answer.id"
              class="px-0"
            >
              <template #prepend>
                <v-icon
                  :color="getAnswerColor(answer)"
                  :icon="getAnswerIcon(answer)"
                  size="20"
                  class="mr-2"
                />
              </template>
              <v-list-item-title class="text-body-2">
                {{ answer.question?.texto }}
              </v-list-item-title>
              <template #append>
                <div class="text-right">
                  <!--
                    FIX: formatAnswer recibe el objeto answer completo,
                    no solo answer.valor. Así puede leer answer.question.tipo
                    para distinguir BOOLEAN ('Bueno'/'Malo') de SINO ('Sí'/'No').
                  -->
                  <span class="text-body-2 font-weight-medium">
                    {{ formatAnswer(answer) }}
                  </span>
                  <p v-if="answer.observacion" class="text-caption text-orange mt-1">
                    📝 {{ answer.observacion }}
                  </p>
                </div>
              </template>
              <!-- Imagen adjunta — solo si existe imagenUrl -->
              <template v-if="answer.imagenUrl" #subtitle>
                <div class="mt-2">
                  <a :href="uploadUrl(answer.imagenUrl)" target="_blank" rel="noopener" class="img-link">
                    <img
                      :src="uploadUrl(answer.imagenUrl)"
                      alt="Foto de inspección"
                      class="answer-img"
                      @error="(e) => ((e.target as HTMLImageElement).style.display = 'none')"
                    />
                    <span class="img-caption">📷 Ver foto completa</span>
                  </a>
                </div>
              </template>
            </v-list-item>
          </v-list>
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import api from '../api'
import { uploadUrl } from '../utils/uploadUrl'

// ─────────────────────────────────────────────────────────────────
// TIPOS
// FIX: Question ahora incluye `tipo` — imprescindible para que
// formatAnswer pueda distinguir BOOLEAN de SINO.
// ─────────────────────────────────────────────────────────────────
type QuestionTipo = 'BOOLEAN' | 'SINO' | 'NUMERO' | 'TEXTO'

interface Question {
  id?:   number
  texto: string
  tipo:  QuestionTipo   // ← FIX: faltaba en versión anterior
}

interface Answer {
  id:           number
  questionId:   number
  valor:        string | null
  observacion?: string | null
  imagenUrl:    string | null
  question?:    Question
}

interface Response {
  id:                 number
  placa:              string
  ciudad:             string
  contrato:           string
  fecha:              string
  imagenVehiculoUrl?: string | null
  user:               { nombre: string; cedula: string }
  form:               { nombre: string }
  answers:            Answer[]
}

// ── State ──────────────────────────────────────────────────────────
const responses  = ref<Response[]>([])
const loading    = ref(false)
const exporting  = ref(false)
const search     = ref('')
const fechaDesde = ref('')
const fechaHasta = ref('')
const dialog     = ref(false)
const selected   = ref<Response | null>(null)

const headers = [
  { title: 'Conductor', key: 'user.nombre' },
  { title: 'Placa',     key: 'placa' },
  { title: 'Ciudad',    key: 'ciudad' },
  { title: 'Contrato',  key: 'contrato' },
  { title: 'Fecha',     key: 'fecha' },
  { title: 'Estado',    key: 'estado', sortable: false },
  { title: '',          key: 'actions', sortable: false, align: 'end' as const },
]

// ── Helpers de zona horaria Colombia ──────────────────────────────
// Colombia = UTC-5 fijo (sin cambio de horario).
// El backend envía las fechas en UTC. Para filtrar correctamente por
// fecha local (lo que el usuario ve en Colombia) hay que convertir
// ANTES de comparar. new Date(isoUtc).toLocaleDateString() usa el TZ
// del navegador, que puede no ser Bogotá. Usamos Intl para garantizarlo.
function fechaColCDia(isoUtc: string): string {
  // Devuelve 'YYYY-MM-DD' en hora Colombia sin importar el TZ del servidor
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date(isoUtc))
}

// ── Filtrado reactivo ──────────────────────────────────────────────
const filteredResponses = computed(() => {
  const q = search.value.toLowerCase().trim()
  return responses.value.filter((r) => {
    // Convertir la fecha de la inspección a día Colombia (YYYY-MM-DD)
    const fechaCol = fechaColCDia(r.fecha)   // ej: '2026-04-15'
    if (fechaDesde.value && fechaCol < fechaDesde.value) return false
    if (fechaHasta.value && fechaCol > fechaHasta.value) return false
    if (q) {
      const match =
        (r.user?.nombre ?? '').toLowerCase().includes(q) ||
        (r.user?.cedula ?? '').toLowerCase().includes(q) ||
        (r.placa        ?? '').toLowerCase().includes(q) ||
        (r.ciudad       ?? '').toLowerCase().includes(q) ||
        (r.contrato     ?? '').toLowerCase().includes(q)
      if (!match) return false
    }
    return true
  })
})

function formatDate(date: string) {
  return new Date(date).toLocaleString('es-CO', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

// ─────────────────────────────────────────────────────────────────
// FIX: formatAnswer — recibe el objeto Answer completo.
//
// ANTES (roto):
//   formatAnswer(valor: string | null | undefined)
//   → !valor siempre devolvía '📷 Foto adjunta'
//   → 'NO' siempre era '❌ Malo' sin importar si era BOOLEAN o SINO
//   → 'SI' no tenía handler → mostraba el string crudo 'SI'
//
// AHORA (correcto):
//   formatAnswer(answer: Answer)
//   → usa answer.question?.tipo para rama correcta
//   BOOLEAN → Bueno (OK) / Malo (NO)
//   SINO    → Sí (SI)    / No (NO)
//   TEXTO   → valor libre
//   NUMERO  → valor numérico
// ─────────────────────────────────────────────────────────────────
function formatAnswer(answer: Answer): string {
  const tipo  = (answer.question?.tipo ?? '').toUpperCase()
  const valor = (answer.valor ?? '').toUpperCase()

  if (tipo === 'BOOLEAN') {
    if (valor === 'OK')          return '✅ Bueno'
    if (valor === 'NO')          return '❌ Malo'
    if (valor === 'OBSERVACION') return '⚠️ Observación'
    if (!answer.valor && answer.imagenUrl) return '📷 Foto adjunta'
    return answer.valor ?? '—'
  }

  if (tipo === 'SINO') {
    if (valor === 'SI') return '✅ Sí'
    if (valor === 'NO') return '❌ No'
    if (!answer.valor && answer.imagenUrl) return '📷 Foto adjunta'
    return answer.valor ?? '—'
  }

  if (tipo === 'TEXTO' || tipo === 'NUMERO') {
    return answer.valor || '—'
  }

  // Fallback sin tipo (datos sin question embebida)
  if (valor === 'OK')          return '✅ Bueno'
  if (valor === 'SI')          return '✅ Sí'
  if (valor === 'NO')          return '❌ No / Malo'
  if (valor === 'OBSERVACION') return '⚠️ Observación'
  if (!answer.valor && answer.imagenUrl) return '📷 Foto adjunta'
  return answer.valor ?? '—'
}

// ─────────────────────────────────────────────────────────────────
// FIX: getEstado — detecta novedad en BOOLEAN y en SINO.
// Un SINO/NO (conductor no apto) es tan crítico como un BOOLEAN/NO.
// ─────────────────────────────────────────────────────────────────
function getEstado(answers: Answer[]) {
  const hasMalo = answers.some((a) => {
    const tipo  = (a.question?.tipo ?? '').toUpperCase()
    const valor = (a.valor ?? '').toUpperCase()
    if (tipo === 'BOOLEAN' && valor === 'NO') return true
    if (tipo === 'SINO'    && valor === 'NO') return true
    if (!tipo              && valor === 'NO') return true  // fallback legacy
    return false
  })
  return hasMalo
    ? { label: 'Con novedad', color: 'orange' }
    : { label: 'Sin novedad', color: 'green' }
}

// ─────────────────────────────────────────────────────────────────
// FIX: getAnswerColor — incluye SINO 'SI' → verde
// ─────────────────────────────────────────────────────────────────
function getAnswerColor(answer: Answer): string {
  const tipo  = (answer.question?.tipo ?? '').toUpperCase()
  const valor = (answer.valor ?? '').toUpperCase()
  if (tipo === 'TEXTO' || tipo === 'NUMERO') return 'grey'
  if (!answer.valor && answer.imagenUrl)     return 'blue'
  if (valor === 'OK' || valor === 'SI')      return 'green'
  if (valor === 'NO')                        return 'orange'
  return 'grey'
}

// ─────────────────────────────────────────────────────────────────
// FIX: getAnswerIcon — incluye SINO 'SI' → check-circle
// ─────────────────────────────────────────────────────────────────
function getAnswerIcon(answer: Answer): string {
  const tipo  = (answer.question?.tipo ?? '').toUpperCase()
  const valor = (answer.valor ?? '').toUpperCase()
  if (tipo === 'TEXTO')                  return 'mdi-text'
  if (tipo === 'NUMERO')                 return 'mdi-numeric'
  if (!answer.valor && answer.imagenUrl) return 'mdi-camera'
  if (valor === 'OK' || valor === 'SI')  return 'mdi-check-circle'
  if (valor === 'NO')                    return 'mdi-alert-circle'
  return 'mdi-information'
}

function viewDetail(item: Response) { selected.value = item; dialog.value = true }
function clearFilters() { search.value = ''; fechaDesde.value = ''; fechaHasta.value = '' }

// ── Helper interno para detectar novedad (usado en exportExcel) ───
function isMalo(a: Answer): boolean {
  const tipo  = (a.question?.tipo ?? '').toUpperCase()
  const valor = (a.valor ?? '').toUpperCase()
  if (tipo === 'TEXTO' || tipo === 'NUMERO') return false
  return valor === 'NO'
}

async function exportExcel() {
  exporting.value = true
  try {
    const data = filteredResponses.value
    if (!data.length) { exporting.value = false; return }

    const wb = XLSX.utils.book_new()
    const now = new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' })

    // ── CONSTANTES ────────────────────────────────────────────
    const NAVY     = '1A2540'
    const NAVY2    = '243354'
    const WHITE    = 'FFFFFF'
    const GREEN_BG = 'F0FDF4'; const GREEN_TXT = '166534'
    const RED_BG   = 'FFF5F5'; const RED_TXT   = 'E63D2F'
    const AMBER_BG = 'FFFBEB'; const AMBER_TXT = '92400E'
    const ROW1     = 'FAFBFC'; const ROW2      = 'FFFFFF'
    const BORDER   = 'D4D9E3'

    // ── ESTILOS (consistentes con Dashboard) ──────────────────
    const sTitle  = { font:{bold:true,sz:14,color:{rgb:WHITE}}, fill:{fgColor:{rgb:NAVY}},  alignment:{horizontal:'center',vertical:'center'} }
    const sInfo   = { font:{sz:10,color:{rgb:'4A5568'}},        fill:{fgColor:{rgb:'F2F4F7'}}, alignment:{horizontal:'center',vertical:'center'} }
    const sHdr    = { font:{bold:true,sz:10,color:{rgb:WHITE}}, fill:{fgColor:{rgb:'2D4A7A'}}, alignment:{horizontal:'center',vertical:'center',wrapText:true},
                      border:{top:{style:'thin',color:{rgb:WHITE}},bottom:{style:'thin',color:{rgb:WHITE}},
                              left:{style:'thin',color:{rgb:WHITE}},right:{style:'thin',color:{rgb:WHITE}}} }
    const sHdrOk  = { ...sHdr, fill:{fgColor:{rgb:'166534'}} }
    const sHdrBad = { ...sHdr, fill:{fgColor:{rgb:'C42D20'}} }
    const sOk     = { font:{bold:true,sz:10,color:{rgb:GREEN_TXT}}, fill:{fgColor:{rgb:GREEN_BG}}, alignment:{horizontal:'center',vertical:'center'},
                      border:{top:{style:'thin',color:{rgb:BORDER}},bottom:{style:'thin',color:{rgb:BORDER}},
                              left:{style:'thin',color:{rgb:BORDER}},right:{style:'thin',color:{rgb:BORDER}}} }
    const sBad    = { font:{bold:true,sz:10,color:{rgb:RED_TXT}},   fill:{fgColor:{rgb:RED_BG}},   alignment:{horizontal:'center',vertical:'center'},
                      border:{top:{style:'thin',color:{rgb:BORDER}},bottom:{style:'thin',color:{rgb:BORDER}},
                              left:{style:'thin',color:{rgb:BORDER}},right:{style:'thin',color:{rgb:BORDER}}} }
    const sAmber  = { font:{bold:true,sz:10,color:{rgb:AMBER_TXT}}, fill:{fgColor:{rgb:AMBER_BG}}, alignment:{horizontal:'center',vertical:'center'},
                      border:{top:{style:'thin',color:{rgb:BORDER}},bottom:{style:'thin',color:{rgb:BORDER}},
                              left:{style:'thin',color:{rgb:BORDER}},right:{style:'thin',color:{rgb:BORDER}}} }
    const sNovedad= { font:{bold:true,sz:10,color:{rgb:'C42D20'}},  fill:{fgColor:{rgb:'FFF0F0'}}, alignment:{horizontal:'center',vertical:'center'},
                      border:{top:{style:'thin',color:{rgb:BORDER}},bottom:{style:'thin',color:{rgb:BORDER}},
                              left:{style:'thin',color:{rgb:BORDER}},right:{style:'thin',color:{rgb:BORDER}}} }
    const sRow    = (i:number) => ({ fill:{fgColor:{rgb:i%2===0?ROW1:ROW2}}, font:{sz:10},
                      border:{top:{style:'thin',color:{rgb:BORDER}},bottom:{style:'thin',color:{rgb:BORDER}},
                              left:{style:'thin',color:{rgb:BORDER}},right:{style:'thin',color:{rgb:BORDER}}} })

    const ss = (ws: any, ref: string, s: any) => {
      if (!ws[ref]) ws[ref] = { t:'s', v:'' }
      ws[ref].s = s
    }
    const rs = (ws: any, row: number, cols: string[], s: any) =>
      cols.forEach(col => ss(ws, `${col}${row}`, s))

    // ── Indicadores ───────────────────────────────────────────
    const total        = data.length
    const conNovedad   = data.filter(r => getEstado(r.answers).label === 'Con novedad').length
    const sinNovedad   = total - conNovedad
    const hoyCol       = fechaColCDia(new Date().toISOString())
    const inspsHoy     = data.filter(r => fechaColCDia(r.fecha) === hoyCol).length
    const placasUnicas = [...new Set(data.map(r => r.placa))]
    const condUnicos   = [...new Set(data.map(r => r.user?.cedula))]
    const pctOk        = total ? Math.round((sinNovedad / total) * 100) : 0
    const contratos    = [...new Set(data.map(r => r.contrato).filter(Boolean))]

    // ══════════════════════════════════════════════════════════
    // HOJA 1: DASHBOARD DE AUDITORÍA
    // KPIS globales + resumen ejecutivo
    // ══════════════════════════════════════════════════════════
    const ws0Data: (string|number)[][] = [
      ['AUDITORÍA DE INSPECCIÓN PREOPERACIONAL'],
      [`Generado: ${now}  ·  Filtros activos: ${search.value || '(sin filtro)'}  ·  Registros: ${total}`],
      [],
      ['INDICADOR', 'VALOR', ''],
      ['Total inspecciones',     total, ''],
      ['Sin novedad',            sinNovedad, ''],
      ['Con novedad',            conNovedad, ''],
      ['Inspecciones hoy',       inspsHoy, ''],
      ['Vehículos inspeccionados', placasUnicas.length, ''],
      ['Conductores activos',    condUnicos.length, ''],
      ['Contratos / Áreas',      contratos.length, ''],
      [],
      ['% CUMPLIMIENTO GLOBAL', `${pctOk}%`, ''],
      [],
      ['RESUMEN DE NOVEDADES MÁS FRECUENTES'],
      ['NOVEDAD', 'FRECUENCIA'],
    ]
    // Top novedades
    const novedadesCount = new Map<string, number>()
    data.forEach(r => {
      r.answers.filter(a => isMalo(a)).forEach(a => {
        const txt = a.question?.texto || '—'
        novedadesCount.set(txt, (novedadesCount.get(txt) || 0) + 1)
      })
    })
    const topNovedades = [...novedadesCount.entries()]
      .sort((a,b) => b[1] - a[1])
      .slice(0, 10)
    if (topNovedades.length) {
      topNovedades.forEach(([n, c]) => ws0Data.push([n, c]))
    } else {
      ws0Data.push(['Sin novedades registradas', ''])
    }

    const ws0 = XLSX.utils.aoa_to_sheet(ws0Data)
    ws0['!cols']   = [{wch:44},{wch:28},{wch:18}]
    ws0['!merges'] = [
      { s:{r:0,c:0}, e:{r:0,c:2} },
      { s:{r:1,c:0}, e:{r:1,c:2} },
    ]
    ws0['!freeze'] = { x:0, y:3 }

    rs(ws0, 1, ['A','B','C'], sTitle)
    rs(ws0, 2, ['A','B','C'], sInfo)
    rs(ws0, 4, ['A','B','C'], { ...sHdr, fill:{fgColor:{rgb:NAVY}} })
    for (let i = 5; i <= 11; i++) {
      rs(ws0, i, ['A','B','C'], { ...sRow(i-5), font:{sz:11} })
      ss(ws0, `A${i}`, { font:{bold:true,sz:10,color:{rgb:'4A5568'}}, fill:{fgColor:{rgb:i%2===0?ROW1:ROW2}} })
      ss(ws0, `B${i}`, { font:{bold:true,sz:13,color:{rgb:NAVY}}, fill:{fgColor:{rgb:i%2===0?ROW1:ROW2}}, alignment:{horizontal:'center'} })
    }
    const pctStyle = pctOk >= 90 ? sOk : pctOk >= 70 ? sAmber : sBad
    ss(ws0, 'B13', { ...pctStyle, font:{bold:true,sz:16} })
    rs(ws0, 15, ['A','B'], { ...sHdrOk, fill:{fgColor:{rgb:'166534'}} })
    topNovedades.forEach((_, i) => {
      const row = i + 16
      rs(ws0, row, ['A','B'], sRow(i))
      ss(ws0, `A${row}`, { font:{sz:10}, fill:{fgColor:{rgb:i%2===0?ROW1:ROW2}} })
      ss(ws0, `B${row}`, { font:{bold:true,sz:11,color:{rgb:'C42D20'}}, fill:{fgColor:{rgb:i%2===0?ROW1:ROW2}}, alignment:{horizontal:'center'} })
    })

    XLSX.utils.book_append_sheet(wb, ws0, '📊 Dashboard Auditoría')

    // ══════════════════════════════════════════════════════════
    // HOJA 2: REGISTRO DE INSPECCIONES
    // ══════════════════════════════════════════════════════════
    const COLS1 = ['A','B','C','D','E','F','G','H','I','J']
    const ws1Data: (string|number)[][] = [
      ['REGISTRO DE INSPECCIÓN PREOPERACIONAL'],
      [`Generado: ${now}  ·  Total registros: ${data.length}`],
      [],
      ['N°','CONDUCTOR','CÉDULA','PLACA','CIUDAD','CONTRATO / ÁREA','FECHA','HORA','ESTADO','NOVEDADES'],
    ]
    data.forEach((r, i) => {
      const fecha     = new Date(r.fecha)
      const novedades = r.answers.filter(a => isMalo(a)).map(a => a.question?.texto || '').join(' | ')
      ws1Data.push([
        i + 1,
        r.user?.nombre || '',
        r.user?.cedula || '',
        r.placa,
        r.ciudad,
        r.contrato,
        fecha.toLocaleDateString('es-CO'),
        fecha.toLocaleTimeString('es-CO', { hour:'2-digit', minute:'2-digit' }),
        getEstado(r.answers).label,
        novedades || 'Sin novedad',
      ])
    })

    const ws1 = XLSX.utils.aoa_to_sheet(ws1Data)
    ws1['!cols']   = [{wch:5},{wch:28},{wch:15},{wch:11},{wch:16},{wch:28},{wch:14},{wch:9},{wch:16},{wch:52}]
    ws1['!merges'] = [
      { s:{r:0,c:0}, e:{r:0,c:9} },
      { s:{r:1,c:0}, e:{r:1,c:9} },
    ]
    ws1['!freeze'] = { x:0, y:4 }
    ws1['!autofilter'] = { ref: `A4:J${ws1Data.length}` }

    rs(ws1, 1, COLS1, sTitle)
    rs(ws1, 2, COLS1, sInfo)
    rs(ws1, 4, COLS1, sHdr)

    data.forEach((r, i) => {
      const row  = i + 5
      const estado = getEstado(r.answers).label
      rs(ws1, row, COLS1, sRow(i))
      // Columna I (ESTADO) con semáforo
      ss(ws1, `I${row}`, estado === 'Con novedad' ? sNovedad : sOk)
      // Columna J (NOVEDADES) destacar si hay
      if (estado === 'Con novedad') ss(ws1, `J${row}`, { ...sRow(i), font:{bold:true,sz:10,color:{rgb:'C42D20'}} })
    })

    XLSX.utils.book_append_sheet(wb, ws1, '📋 Inspecciones')

    // ══════════════════════════════════════════════════════════
    // HOJA 3: DETALLE DE RESPUESTAS
    // ══════════════════════════════════════════════════════════
    const COLS2 = ['A','B','C','D','E','F','G','H','I']
    const ws2Data: (string|number)[][] = [
      ['DETALLE COMPLETO DE RESPUESTAS'],
      [`Generado: ${now}  ·  Desglose por pregunta de cada inspección`],
      [],
      ['N°','CONDUCTOR','CÉDULA','PLACA','FECHA','PREGUNTA','RESPUESTA','ESTADO','FOTO URL'],
    ]
    let rowNum = 1
    data.forEach(r => {
      const fecha = new Date(r.fecha).toLocaleString('es-CO')
      r.answers.forEach(a => {
        const esMalo = isMalo(a)
        ws2Data.push([
          rowNum++,
          r.user?.nombre || '',
          r.user?.cedula || '',
          r.placa,
          fecha,
          a.question?.texto || '',
          formatAnswer(a),
          esMalo ? '⚠️ Novedad' : '✅ OK',
          a.imagenUrl || '',
        ])
      })
    })

    const ws2 = XLSX.utils.aoa_to_sheet(ws2Data)
    ws2['!cols']   = [{wch:5},{wch:26},{wch:14},{wch:11},{wch:18},{wch:52},{wch:16},{wch:13},{wch:48}]
    ws2['!merges'] = [
      { s:{r:0,c:0}, e:{r:0,c:8} },
      { s:{r:1,c:0}, e:{r:1,c:8} },
    ]
    ws2['!freeze'] = { x:0, y:4 }
    ws2['!autofilter'] = { ref: `A4:I${ws2Data.length}` }

    rs(ws2, 1, COLS2, sTitle)
    rs(ws2, 2, COLS2, sInfo)
    rs(ws2, 4, COLS2, sHdr)

    // Aplicar estilo a filas de detalle
    const detailStartRow = 5
    for (let i = 0; i < ws2Data.length - 4; i++) {
      const row = i + detailStartRow
      if (row > ws2Data.length + 3) break
      rs(ws2, row, COLS2, sRow(i))
      const estadoCell = ws2Data[i + 4]?.[7]
      if (estadoCell === '⚠️ Novedad') ss(ws2, `H${row}`, sNovedad)
      else                              ss(ws2, `H${row}`, sOk)
    }

    XLSX.utils.book_append_sheet(wb, ws2, '📊 Detalle')

    // ══════════════════════════════════════════════════════════
    // HOJA 4: ESTADÍSTICAS
    // ══════════════════════════════════════════════════════════
    const ws3Data: (string|number)[][] = [
      ['ESTADÍSTICAS DE AUDITORÍA'],
      [`Generado: ${now}`],
      [],
      ['INDICADOR', 'VALOR', ''],
      ['Total inspecciones',     total, ''],
      ['Sin novedad',            sinNovedad, ''],
      ['Con novedad',            conNovedad, ''],
      ['Inspecciones hoy',       inspsHoy, ''],
      ['Vehículos únicos',       placasUnicas.length, ''],
      ['Conductores únicos',     condUnicos.length, ''],
      ['Contratos / Áreas',      contratos.length, ''],
      [],
      ['% Cumplimiento',     `${pctOk}%`, ''],
      ['% Con novedad',      total ? `${Math.round((conNovedad / total) * 100)}%` : '0%', ''],
      [],
      ['Ranking por vehículo', '', ''],
    ]
    const placasRank = [...new Set(data.map(r => r.placa))].map(placa => {
      const insps = data.filter(r => r.placa === placa)
      const incidencias = insps.filter(r => getEstado(r.answers).label === 'Con novedad').length
      return { placa, total: insps.length, incidencias, pct: Math.round((incidencias / insps.length) * 100) }
    }).sort((a, b) => b.pct - a.pct || b.total - a.total).slice(0, 15)

    ws3Data.push(['PLACA', 'INSPECCIONES', 'INCIDENCIAS', '% INCIDENCIA'])
    placasRank.forEach(p => {
      ws3Data.push([p.placa, p.total, p.incidencias, `${p.pct}%`])
    })

    const ws3 = XLSX.utils.aoa_to_sheet(ws3Data)
    ws3['!cols']   = [{wch:34},{wch:22},{wch:16},{wch:18}]
    ws3['!merges'] = [
      { s:{r:0,c:0}, e:{r:0,c:1} },
      { s:{r:1,c:0}, e:{r:1,c:1} },
    ]
    ws3['!freeze'] = { x:0, y:3 }

    rs(ws3, 1, ['A','B'], sTitle)
    rs(ws3, 2, ['A','B'], sInfo)
    rs(ws3, 4, ['A','B','C'], { ...sHdr, fill:{fgColor:{rgb:NAVY}} })
    // KPI rows 5-11 + 13-14
    for (let i = 5; i <= 11; i++) {
      rs(ws3, i, ['A','B','C'], { ...sRow(i-5), font:{sz:11} })
      ss(ws3, `A${i}`, { font:{bold:true,sz:10,color:{rgb:'4A5568'}}, fill:{fgColor:{rgb:i%2===0?ROW1:ROW2}} })
      ss(ws3, `B${i}`, { font:{bold:true,sz:13,color:{rgb:NAVY}}, fill:{fgColor:{rgb:i%2===0?ROW1:ROW2}}, alignment:{horizontal:'center'} })
    }
    ss(ws3, 'B13', { ...(pctOk >= 90 ? sOk : pctOk >= 70 ? sAmber : sBad), font:{bold:true,sz:16} })
    ss(ws3, 'B14', { ...(pctOk < 30 ? sBad : sOk), font:{bold:true,sz:12} })
    // Ranking header
    rs(ws3, 17, ['A','B','C','D'], { ...sHdr, fill:{fgColor:{rgb:'2D4A7A'}} })
    placasRank.forEach((p, i) => {
      const row = i + 18
      rs(ws3, row, ['A','B','C','D'], sRow(i))
      ss(ws3, `D${row}`, p.pct >= 50 ? sBad : p.pct >= 20 ? sAmber : sOk)
    })

    XLSX.utils.book_append_sheet(wb, ws3, '📈 Estadísticas')

    // ── Descargar ─────────────────────────────────────────────
    const fecha = new Date().toISOString().split('T')[0]
    const buf   = XLSX.write(wb, { bookType:'xlsx', type:'array', cellStyles:true })
    saveAs(
      new Blob([buf], { type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
      `Auditoria_Preoperacional_${fecha}.xlsx`,
    )
  } finally {
    exporting.value = false
  }
}

async function load() {
  loading.value = true
  try {
    const res = await api.get<Response[]>('/responses')
    responses.value = Array.isArray(res.data) ? res.data : []
  } catch (e) {
    console.error('[ResponsesView] load:', e)
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.answer-img {
  display: block;
  max-width: 280px;
  max-height: 200px;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
  object-fit: cover;
  cursor: pointer;
  transition: opacity .15s;
  margin-top: 6px;
}
.answer-img:hover { opacity: .88; }
.img-link { text-decoration: none; display: inline-block; }
.img-caption {
  display: block;
  font-size: 11px;
  color: #8895a7;
  margin-top: 3px;
  font-style: italic;
}
</style>