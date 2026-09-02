<template>
  <div class="report-shell">
    <div class="report-header">
      <h1 class="report-title">REPORTE EJECUTIVO</h1>
      <p class="report-sub">Cumplimiento de inspecciones preoperacionales</p>
    </div>

    <v-card class="filter-card" elevation="0">
      <v-card-text>
        <v-row density="comfortable" align="end">
          <v-col cols="2">
            <v-select
              v-model="filtroAnio"
              :items="aniosDisponibles"
              label="Año"
              density="compact"
              hide-details
            />
          </v-col>
          <v-col cols="2">
            <v-select
              v-model="filtroMes"
              :items="meses"
              item-title="label"
              item-value="value"
              label="Mes"
              density="compact"
              hide-details
            />
          </v-col>
          <v-col cols="2">
            <v-text-field
              v-model="filtroCiudad"
              label="Ciudad"
              density="compact"
              hide-details
              clearable
            />
          </v-col>
          <v-col cols="2">
            <v-text-field
              v-model="filtroConductor"
              label="Conductor"
              density="compact"
              hide-details
              clearable
            />
          </v-col>
          <v-col cols="2">
            <v-text-field
              v-model="filtroPlaca"
              label="Placa"
              density="compact"
              hide-details
              clearable
            />
          </v-col>
          <v-col cols="2" class="d-flex gap-2">
            <v-btn color="primary" variant="flat" @click="cargarReporte" :loading="loading">
              <v-icon start>mdi-magnify</v-icon> Generar
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- KPIs -->

    <!-- Acciones de exportación -->
    <div v-if="reporte" class="d-flex align-center gap-2 mt-2 mb-4">
      <span class="text-caption text-medium-emphasis font-weight-medium">Exportar:</span>
      <v-btn
        color="primary"
        variant="tonal"
        prepend-icon="mdi-microsoft-excel"
        :loading="exporting"
        :disabled="exporting"
        @click="exportarExcel"
        style="color:#fff"
      >
        Excel
      </v-btn>
      <v-btn
        variant="outlined"
        prepend-icon="mdi-file-delimited-outline"
        :disabled="exporting"
        @click="exportarCSV"
      >
        CSV
      </v-btn>
      <v-btn
        variant="outlined"
        prepend-icon="mdi-printer-outline"
        @click="exportarPDF"
      >
        PDF
      </v-btn>
    </div>
    <v-row v-if="reporte" class="mt-4" density="comfortable">
      <v-col v-for="kpi in kpis" :key="kpi.label" cols="6" sm="3" md="3">
        <v-card :style="`border-top:3px solid ${kpi.color};background:${kpi.bg}`" elevation="0">
          <v-card-text class="text-center pa-3">
            <div class="kpi-val" :style="`color:${kpi.color}`">{{ kpi.value }}</div>
            <div class="kpi-label">{{ kpi.label }}</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Error -->
    <v-alert v-if="error" type="error" class="mt-4" closable>{{ error }}</v-alert>

    <!-- Preview table -->
    <v-card v-if="reporte" class="mt-4" elevation="0">
      <v-card-text class="pa-0">
        <div class="table-wrap">
          <table class="report-table">
            <thead>
              <tr>
                <th>CONDUCTOR</th>
                <th>CÉDULA</th>
                <th>PLACA</th>
                <th v-for="d in reporte.meta.totalDias" :key="d" class="day-th">
                  {{ d }}
                </th>
                <th>%</th>
                <th>OK</th>
                <th>NO</th>
              </tr>
              <tr class="day-names">
                <th colspan="3"></th>
                <th v-for="d in diasDelMes" :key="d.date" class="day-name">
                  {{ d.dayName?.slice(0, 3) }}
                </th>
                <th colspan="3"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(driver, i) in (printMode ? reporte.drivers : pagedDrivers)" :key="driver.id" :class="{ alt: i % 2 === 1 }">
                <td class="td-name">{{ driver.nombre }}</td>
                <td class="td-cedula">{{ driver.cedula }}</td>
                <td class="td-placa">{{ driver.placa || '—' }}</td>
                <td v-for="day in driver.days" :key="day.date" class="td-day">
                  <span
                    class="day-dot"
                    :class="`dot-${day.status}`"
                    :title="tooltip(day)"
                  />
                </td>
                <td class="td-pct" :class="pctClass(driver.compliance)">
                  {{ driver.compliance }}%
                </td>
                <td class="td-num">{{ driver.completed }}</td>
                <td class="td-num" :class="{ 'td-bad': driver.incomplete > 0 }">
                  {{ driver.incomplete }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Paginación de previsualización (oculta al imprimir) -->
        <div
          v-if="!printMode && reporte.drivers.length > REPORT_PAGE_SIZE"
          class="report-pager no-print"
        >
          <span class="rp-info">Mostrando {{ pagedDrivers.length }} de {{ reporte.drivers.length }} conductores</span>
          <div class="rp-nav">
            <button class="rp-btn" :disabled="reportPage === 0" @click="reportPage--">‹ Anterior</button>
            <span class="rp-pg">{{ reportPage + 1 }} / {{ totalReportPages }}</span>
            <button class="rp-btn" :disabled="reportPage >= totalReportPages - 1" @click="reportPage++">Siguiente ›</button>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import api from '../api'
import { generateExecutiveExcel } from '../utils/reportExcel'

interface ExecutiveReport {
  meta: {
    empresa: string; mes: string; mesNumero: number; anio: number
    totalDias: number; diasLaborables: number; fechaGeneracion: string
    usuario: string; totalConductores: number
    cumplieronHoy: number; incumplieronHoy: number
    enVacaciones: number; enAusencias: number; enDescanso: number
    cumplimientoGeneral: number; totalInspecciones: number; totalIncumplimientos: number
  }
  drivers: any[]
  dailyCompliance: any[]
  statusSummary: { completed: number; incomplete: number; vacation: number; ausencia: number; rest: number }
  top10Best: any[]
  top10Worst: any[]
}

const loading = ref(false)
const exporting = ref(false)
const error = ref('')
const reporte = ref<ExecutiveReport | null>(null)

/* ── Paginación de la tabla de previsualización ───────────
   50 filas por página en pantalla; en modo impresión (printMode)
   se renderiza la tabla completa para que el PDF salga íntegro. */
const REPORT_PAGE_SIZE = 50
const reportPage = ref(0)
const printMode = ref(false)

const totalReportPages = computed(() =>
  reporte.value ? Math.max(1, Math.ceil(reporte.value.drivers.length / REPORT_PAGE_SIZE)) : 1
)
const pagedDrivers = computed(() => {
  if (!reporte.value) return []
  const d = reporte.value.drivers
  return d.slice(reportPage.value * REPORT_PAGE_SIZE, (reportPage.value + 1) * REPORT_PAGE_SIZE)
})
watch(totalReportPages, tp => {
  if (reportPage.value > tp - 1) reportPage.value = Math.max(0, tp - 1)
})

/* ── Fin del modo impresión ────────────────────────────── */
function endPrintMode() { printMode.value = false }
window.addEventListener('afterprint', endPrintMode)
const printMQ = window.matchMedia('print')
const mqChange = (e: MediaQueryListEvent) => { if (!e.matches) printMode.value = false }
if (typeof printMQ.addEventListener === 'function') {
  printMQ.addEventListener('change', mqChange)
}
onUnmounted(() => {
  window.removeEventListener('afterprint', endPrintMode)
  if (typeof printMQ.removeEventListener === 'function') {
    printMQ.removeEventListener('change', mqChange)
  }
})

const now = new Date()
const filtroAnio = ref(now.getFullYear())
const filtroMes = ref(now.getMonth() + 1)
const filtroCiudad = ref('')
const filtroConductor = ref('')
const filtroPlaca = ref('')

const aniosDisponibles = computed(() => {
  const y = now.getFullYear()
  return Array.from({ length: 5 }, (_, i) => y - 2 + i)
})

const meses = [
  { label: 'Enero', value: 1 }, { label: 'Febrero', value: 2 },
  { label: 'Marzo', value: 3 }, { label: 'Abril', value: 4 },
  { label: 'Mayo', value: 5 }, { label: 'Junio', value: 6 },
  { label: 'Julio', value: 7 }, { label: 'Agosto', value: 8 },
  { label: 'Septiembre', value: 9 }, { label: 'Octubre', value: 10 },
  { label: 'Noviembre', value: 11 }, { label: 'Diciembre', value: 12 },
]

const diasDelMes = computed(() => {
  const total = reporte.value?.meta.totalDias || 30
  const dias = []
  for (let d = 1; d <= total; d++) {
    const dt = new Date(filtroAnio.value, filtroMes.value - 1, d)
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
    dias.push({ date: dt.toISOString().slice(0, 10), dayName: dayNames[dt.getDay()], dayNumber: d })
  }
  return dias
})

const kpis = computed(() => {
  if (!reporte.value) return []
  const m = reporte.value.meta
  return [
    { label: 'CONDUCTORES ACTIVOS', value: m.totalConductores, color: '#1A2540', bg: '#F9FAFB' },
    { label: 'CUMPLIERON HOY', value: m.cumplieronHoy, color: '#2AA63E', bg: '#E9F7EB' },
    { label: 'INCUMPLIERON HOY', value: m.incumplieronHoy, color: '#E7180B', bg: '#FDE8E7' },
    { label: 'VACACIONES', value: m.enVacaciones, color: '#FFD230', bg: '#FFFBEB' },
    { label: 'AUSENCIA', value: m.enAusencias, color: '#7F22FE', bg: '#F3E8FF' },
    { label: 'DESCANSO', value: m.enDescanso, color: '#FE7F01', bg: '#FFF2E5' },
    { label: 'CUMPLIMIENTO', value: `${m.cumplimientoGeneral}%`, color: m.cumplimientoGeneral >= 80 ? '#2AA63E' : m.cumplimientoGeneral >= 50 ? '#FFD230' : '#E7180B', bg: '#F9FAFB' },
    { label: 'INSPECCIONES', value: m.totalInspecciones, color: '#2D4A7A', bg: '#F2F4F7' },
  ]
})

function tooltip(day: any): string {
  const map: Record<string, string> = {
    completed: 'Completó', incomplete: 'Incumplió', vacation: 'Vacaciones', rest: 'Descanso', future: 'Futuro',
  }
  return `${day.dayName} ${day.dayNumber} — ${map[day.status] || day.status}`
}

function pctClass(pct: number): string {
  return pct >= 80 ? 'pct-good' : pct >= 50 ? 'pct-amber' : 'pct-bad'
}

async function cargarReporte(): Promise<void> {
  loading.value = true
  error.value = ''
  try {
    const params: any = { year: filtroAnio.value, month: filtroMes.value }
    if (filtroCiudad.value) params.ciudad = filtroCiudad.value
    if (filtroConductor.value) params.driverId = filtroConductor.value
    if (filtroPlaca.value) params.placa = filtroPlaca.value
    const { data } = await api.get('/reports/executive', { params })
    reporte.value = data
    reportPage.value = 0
    printMode.value = false
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Error al cargar el reporte'
  } finally {
    loading.value = false
  }
}

async function exportarExcel(): Promise<void> {
  if (!reporte.value) return
  exporting.value = true
  try {
    await generateExecutiveExcel(reporte.value)
  } catch (e: any) {
    error.value = 'Error al generar Excel'
    console.error(e)
  } finally {
    exporting.value = false
  }
}

function exportarCSV(): void {
  if (!reporte.value) return
  const m = reporte.value.meta
  let csv = `"REPORTE EJECUTIVO - ${m.empresa} - ${m.mes} ${m.anio}"\n`
  csv += `"Generado: ${m.fechaGeneracion}","Usuario: ${m.usuario}"\n\n`
  csv += '"CONDUCTOR","CÉDULA","PLACA"'
  for (let d = 1; d <= m.totalDias; d++) csv += `,"Día ${d}"`
  csv += ',"% CUMPLIMIENTO","INSPECCIONES","INCUMPLIMIENTOS"\n'

  reporte.value.drivers.forEach((d: any) => {
    csv += `"${d.nombre}","${d.cedula}","${d.placa || ''}"`
    d.days.forEach((day: any) => {
      const map: Record<string, string> = { completed: '✓', incomplete: '✗', vacation: 'V', rest: '-', future: '' }
      csv += `,"${map[day.status] || ''}"`
    })
    csv += `,"${d.compliance}%","${d.completed}","${d.incomplete}"\n`
  })

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `Reporte_${m.mes}_${m.anio}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function exportarPDF(): void {
  if (!reporte.value) return
  // Renderiza la tabla completa para que el PDF/impresión salga íntegro
  printMode.value = true
  requestAnimationFrame(() => { window.print() })
}
</script>

<style scoped>
.report-shell { padding: 20px; max-width: 1400px; margin: 0 auto; }
.report-header { margin-bottom: 16px; }
.report-title { font-family: 'Barlow Condensed', sans-serif; font-size: 28px; font-weight: 900; color: #1a2540; margin: 0; letter-spacing: 1px; }
.report-sub { font-size: 14px; color: #8895a7; margin: 4px 0 0; }
.filter-card { border: 1px solid #e4e7ed !important; border-radius: 10px !important; }
.gap-2 { gap: 8px; }
.kpi-val { font-family: 'Barlow Condensed', sans-serif; font-size: 28px; font-weight: 900; line-height: 1.1; }
.kpi-label { font-family: 'Barlow Condensed', sans-serif; font-size: 10px; font-weight: 700; letter-spacing: 1px; color: #6b7280; margin-top: 2px; }

.table-wrap { overflow-x: auto; border: 1px solid #e4e7ed; border-radius: 8px; }
.report-table { width: 100%; border-collapse: collapse; font-size: 12px; min-width: 800px; }
.report-table th { background: #1A2540; color: #fff; padding: 8px 6px; font-family: 'Barlow Condensed', sans-serif; font-size: 9px; font-weight: 700; letter-spacing: 1px; white-space: nowrap; text-align: center; position: sticky; top: 0; z-index: 1; }
.report-table th.day-th { min-width: 24px; }
.day-names th { background: #2D4A7A !important; font-size: 8px; padding: 3px 4px; }
.report-table td { padding: 6px 8px; border-bottom: 1px solid #f0f2f6; vertical-align: middle; }
.report-table .alt td { background: #FAFBFC; }
.td-name { font-weight: 600; color: #1a2540; white-space: nowrap; }
.td-cedula { color: #4a5568; font-size: 11px; }
.td-placa { font-family: 'Barlow Condensed', sans-serif; font-weight: 700; letter-spacing: 1px; color: #1a2540; }
.td-day { text-align: center; }
.day-dot { display: inline-block; width: 14px; height: 14px; border-radius: 3px; }
.dot-completed { background: #2AA63E; }
.dot-incomplete { background: #E7180B; }
.dot-vacation { background: #FFD230; }
.dot-ausencia { background: #7F22FE; }
.dot-rest { background: #FE7F01; }
.dot-future { background: #D4D9E3; }
.pct-good { color: #2AA63E; }
.pct-amber { color: #FFD230; }
.pct-bad { color: #E7180B; }
.td-bad { color: #E7180B; }

/* ── Paginación del reporte ──────────────────────────── */
.report-pager { display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap; padding: 12px 16px; border-top: 1px solid #e4e7ed; font-size: 13px; color: #4a5568; }
.rp-nav { display: flex; align-items: center; gap: 8px; }
.rp-btn { padding: 7px 14px; border-radius: 6px; border: 1.5px solid #e4e7ed; background: #fff; color: #1a2540; font-size: 12px; font-weight: 600; cursor: pointer; transition: all .15s; }
.rp-btn:hover:not(:disabled) { border-color: #1a2540; background: #f2f4f7; }
.rp-btn:disabled { opacity: .45; cursor: not-allowed; }
.rp-pg { font-family: 'Barlow Condensed', sans-serif; font-size: 13px; font-weight: 700; letter-spacing: .5px; color: #0d1422; }
@media print { .no-print { display: none !important; } }
</style>
