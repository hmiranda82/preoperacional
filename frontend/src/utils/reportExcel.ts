import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'

interface DriverDay {
  date: string; dayName: string; dayNumber: number
  status: 'completed' | 'incomplete' | 'vacation' | 'ausencia' | 'rest' | 'future'
}

interface ReportDriver {
  id: number; nombre: string; cedula: string; placa: string | null
  ciudad: string | null; supervisor: string | null; tipoVehiculo: string | null
  diasLaborales: string
  days: DriverDay[]; completed: number; incomplete: number; vacations: number
  ausencias: number; restDays: number; futureDays: number; compliance: number
  totalInspections: number; totalIncumplimientos: number
}

interface DailyCompliance {
  date: string; dayName: string; dayNumber: number; total: number
  completed: number; incomplete: number; vacation: number; ausencia: number; rest: number; future: number; pct: number
}

interface ExecutiveReport {
  meta: {
    empresa: string; mes: string; mesNumero: number; anio: number
    totalDias: number; diasLaborables: number; fechaGeneracion: string
    usuario: string; totalConductores: number
    cumplieronHoy: number; incumplieronHoy: number
    enVacaciones: number; enDescanso: number; enAusencias: number
    cumplimientoGeneral: number; totalInspecciones: number; totalIncumplimientos: number
  }
  drivers: ReportDriver[]
  dailyCompliance: DailyCompliance[]
  statusSummary: { completed: number; incomplete: number; vacation: number; ausencia: number; rest: number }
  top10Best: Array<{ nombre: string; cedula: string; ciudad: string | null; compliance: number; completed: number }>
  top10Worst: Array<{ nombre: string; cedula: string; ciudad: string | null; compliance: number; incomplete: number }>
}

const NAVY = '1A2540'
const NAVY2 = '2D4A7A'
const WHITE = 'FFFFFF'
const GREEN = '2AA63E'
const GREEN_BG = 'E9F7EB'
const RED = 'E7180B'
const RED_BG = 'FDE8E7'
const YELLOW = 'FFD230'
const YELLOW_BG = 'FFFBEB'
const ORANGE = 'FE7F01'
const ORANGE_BG = 'FFF2E5'
const PURPLE = '7F22FE'
const PURPLE_BG = 'F3E8FF'
const GRAY = '9CA3AF'
const GRAY_BG = 'F9FAFB'
const BORDER = 'D4D9E3'
const ROW1 = 'FAFBFC'
const ROW2 = 'FFFFFF'

const clr = (hex: string) => ({ argb: `FF${hex}` })

function baseBorder() {
  return {
    top: { style: 'thin' as const, color: clr(BORDER) },
    bottom: { style: 'thin' as const, color: clr(BORDER) },
    left: { style: 'thin' as const, color: clr(BORDER) },
    right: { style: 'thin' as const, color: clr(BORDER) },
  }
}

function rowFill(i: number) {
  return { type: 'pattern' as const, pattern: 'solid' as const, fgColor: clr(i % 2 === 0 ? ROW1 : ROW2) }
}

function headerRowStyle(ws: ExcelJS.Worksheet, row: number, colCount: number, fillColor: string) {
  for (let c = 1; c <= colCount; c++) {
    const cell = ws.getRow(row).getCell(c)
    cell.font = { bold: true, size: 10, color: clr(WHITE) }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: clr(fillColor) }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
    cell.border = baseBorder()
  }
}

export async function generateExecutiveExcel(report: ExecutiveReport): Promise<void> {
  const { meta, drivers, dailyCompliance, top10Best, top10Worst } = report
  const wb = new ExcelJS.Workbook()
  wb.creator = meta.usuario
  wb.created = new Date()

  // ═══════════════════════════════════════════════════════════════
  // SHEET 1: DASHBOARD EJECUTIVO
  // ═══════════════════════════════════════════════════════════════
  const ws = wb.addWorksheet('Dashboard Ejecutivo', {
    pageSetup: {
      paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1,
      margins: { left: 0.5, right: 0.5, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2 },
    } as any,
  })

  ws.columns = [
    { width: 22 }, { width: 16 }, { width: 16 }, { width: 14 },
    { width: 14 }, { width: 14 }, { width: 14 }, { width: 14 },
  ]

  // ── Title section ──────────────────────────────────────────────
  const titleRow = ws.addRow(['REPORTE EJECUTIVO DE CUMPLIMIENTO — PREOPERACIONAL'])
  ws.mergeCells(`A${titleRow.number}:H${titleRow.number}`)
  const tCell = titleRow.getCell(1)
  tCell.font = { bold: true, size: 18, color: clr(WHITE), name: 'Calibri' }
  tCell.fill = { type: 'pattern', pattern: 'solid', fgColor: clr(NAVY) }
  tCell.alignment = { horizontal: 'center', vertical: 'middle' }
  titleRow.height = 42

  // ── Subtitle ───────────────────────────────────────────────────
  const subRow = ws.addRow([`${meta.empresa} · ${meta.mes} ${meta.anio}  ·  Generado: ${meta.fechaGeneracion}  ·  Usuario: ${meta.usuario}`])
  ws.mergeCells(`A${subRow.number}:H${subRow.number}`)
  const sCell = subRow.getCell(1)
  sCell.font = { size: 10, color: clr('4A5568'), name: 'Calibri' }
  sCell.fill = { type: 'pattern', pattern: 'solid', fgColor: clr('F2F4F7') }
  sCell.alignment = { horizontal: 'center', vertical: 'middle' }
  subRow.height = 26

  ws.addRow([])

  // ── KPI Cards ──────────────────────────────────────────────────
  const kpiDefs = [
    { label: 'CONDUCTORES\nACTIVOS', value: meta.totalConductores, color: NAVY },
    { label: 'CUMPLIERON\nHOY', value: meta.cumplieronHoy, color: GREEN },
    { label: 'INCUMPLIERON\nHOY', value: meta.incumplieronHoy, color: RED },
    { label: 'EN\nVACACIONES', value: meta.enVacaciones, color: YELLOW },
    { label: 'EN\nAUSENCIA', value: meta.enAusencias, color: PURPLE },
    { label: 'EN\nDESCANSO', value: meta.enDescanso, color: ORANGE },
    { label: 'CUMPLIMIENTO\nGENERAL', value: `${meta.cumplimientoGeneral}%`, color: meta.cumplimientoGeneral >= 80 ? GREEN : meta.cumplimientoGeneral >= 50 ? YELLOW : RED },
    { label: 'INSPECCIONES', value: meta.totalInspecciones, color: NAVY2 },
  ]

  // Value row
  const valRow = ws.addRow(kpiDefs.map(d => d.value))
  valRow.height = 40
  // Label row
  const lblRow = ws.addRow(kpiDefs.map(d => ''))
  lblRow.height = 36

  kpiDefs.forEach((d, i) => {
    const vCell = valRow.getCell(i + 1)
    vCell.font = { bold: true, size: 22, color: clr(d.color), name: 'Calibri' }
    vCell.alignment = { horizontal: 'center', vertical: 'middle' }
    vCell.fill = { type: 'pattern', pattern: 'solid', fgColor: clr('F9FAFB') }
    vCell.border = {
      top: { style: 'medium', color: clr(d.color) },
      bottom: { style: 'thin', color: clr(BORDER) },
      left: { style: 'thin', color: clr(BORDER) },
      right: { style: 'thin', color: clr(BORDER) },
    }

    const lCell = lblRow.getCell(i + 1)
    lCell.value = d.label
    lCell.font = { bold: true, size: 9, color: clr('6B7280'), name: 'Calibri' }
    lCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
    lCell.fill = { type: 'pattern', pattern: 'solid', fgColor: clr('F9FAFB') }
    lCell.border = {
      top: { style: 'thin', color: clr(BORDER) },
      bottom: { style: 'medium', color: clr(d.color) },
      left: { style: 'thin', color: clr(BORDER) },
      right: { style: 'thin', color: clr(BORDER) },
    }
  })

  ws.addRow([])

  // ── Summary section ────────────────────────────────────────────
  const sumTitle = ws.addRow(['RESUMEN GENERAL DEL PERÍODO'])
  ws.mergeCells(`A${sumTitle.number}:H${sumTitle.number}`)
  const sumTCell = sumTitle.getCell(1)
  sumTCell.font = { bold: true, size: 12, color: clr(WHITE), name: 'Calibri' }
  sumTCell.fill = { type: 'pattern', pattern: 'solid', fgColor: clr(NAVY2) }
  sumTCell.alignment = { horizontal: 'center', vertical: 'middle' }
  sumTitle.height = 28

  const summaryRows = [
    ['Total Inspecciones Realizadas', meta.totalInspecciones],
    ['Total Conductores con Incumplimientos', meta.totalIncumplimientos],
    ['Días del Período', meta.totalDias],
    ['Cumplimiento General', `${meta.cumplimientoGeneral}%`],
  ]
  summaryRows.forEach((s, i) => {
    const r = ws.addRow(s)
    r.height = 22
    const c1 = r.getCell(1)
    c1.font = { bold: true, size: 10, color: clr('4A5568'), name: 'Calibri' }
    c1.fill = rowFill(i)
    c1.border = baseBorder()
    const c2 = r.getCell(2)
    c2.font = { bold: true, size: 13, color: clr(NAVY), name: 'Calibri' }
    c2.alignment = { horizontal: 'center', vertical: 'middle' }
    c2.fill = rowFill(i)
    c2.border = baseBorder()
  })

  // ═══════════════════════════════════════════════════════════════
  // SHEET 2: CALENDARIO DE CUMPLIMIENTO
  // ═══════════════════════════════════════════════════════════════
  const ws2 = wb.addWorksheet('Calendario de Cumplimiento', {
    pageSetup: {
      paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1,
      margins: { left: 0.3, right: 0.3, top: 0.3, bottom: 0.3, header: 0.15, footer: 0.15 },
      showGridLines: false,
    } as any,
  })

  const DAY_COL_W = Math.max(4.5, Math.min(6.5, 100 / Math.max(meta.totalDias, 1)))
  ws2.columns = [
    { width: 30 }, { width: 16 }, { width: 16 }, { width: 14 },
    ...Array(meta.totalDias).fill({ width: DAY_COL_W }),
    { width: 10 }, { width: 12 }, { width: 10 }, { width: 30 },
  ]
  const TOTAL_CAL_COLS = 5 + meta.totalDias + 4

  // ── Title ──────────────────────────────────────────────────────
  const calTitleRow = ws2.addRow([`CALENDARIO DE CUMPLIMIENTO — ${meta.mes} ${meta.anio}`])
  ws2.mergeCells(1, 1, 1, TOTAL_CAL_COLS - 4)
  const ctCell = calTitleRow.getCell(1)
  ctCell.font = { bold: true, size: 14, color: clr(WHITE), name: 'Calibri' }
  ctCell.fill = { type: 'pattern', pattern: 'solid', fgColor: clr(NAVY) }
  ctCell.alignment = { horizontal: 'center', vertical: 'middle' }
  calTitleRow.height = 34

  // ── Subtitle ───────────────────────────────────────────────────
  const calSubRow = ws2.addRow([`${meta.empresa} · Generado: ${meta.fechaGeneracion}`])
  ws2.mergeCells(2, 1, 2, TOTAL_CAL_COLS - 4)
  const csCell = calSubRow.getCell(1)
  csCell.font = { size: 9, color: clr('4A5568'), name: 'Calibri' }
  csCell.fill = { type: 'pattern', pattern: 'solid', fgColor: clr('F2F4F7') }
  csCell.alignment = { horizontal: 'center', vertical: 'middle' }
  calSubRow.height = 22

  // ── Header row (day numbers) ───────────────────────────────────
  const hLabels = ['CONDUCTOR', 'CÉDULA', 'CIUDAD', 'PLACA']
  for (let d = 1; d <= meta.totalDias; d++) hLabels.push(String(d))
  hLabels.push('%', 'OK', 'NO', 'OBSERVACIONES')

  const hRow = ws2.addRow(hLabels)
  hRow.height = 28
  hRow.eachCell((cell, col) => {
    cell.font = { bold: true, size: 9, color: clr(WHITE), name: 'Calibri' }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: clr(NAVY2) }
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
    cell.border = baseBorder()
  })

  // ── Day-name sub-header ────────────────────────────────────────
  const dnRow = ws2.addRow(['', '', '', '', ...drivers[0]?.days.map(d => d.dayName.slice(0, 3)) || [], '', '', '', ''])
  dnRow.height = 16
  dnRow.eachCell((cell, col) => {
    if (col >= 4 && col <= 3 + meta.totalDias) {
      cell.font = { size: 8, color: clr('6B7280'), name: 'Calibri' }
      cell.alignment = { horizontal: 'center', vertical: 'middle' }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: clr('F2F4F7') }
      cell.border = baseBorder()
    }
  })

  // ── Driver rows ────────────────────────────────────────────────
  const statusColor: Record<string, string> = {
    completed: GREEN, incomplete: RED, vacation: YELLOW, ausencia: PURPLE, rest: ORANGE, future: GRAY,
  }
  const statusBg: Record<string, string> = {
    completed: GREEN_BG, incomplete: RED_BG, vacation: YELLOW_BG, ausencia: PURPLE_BG, rest: ORANGE_BG, future: GRAY_BG,
  }
  const statusIcon: Record<string, string> = {
    completed: '✓', incomplete: '✗', vacation: 'V', ausencia: 'P', rest: 'D', future: '',
  }

  const sortedDrivers = [...drivers].sort((a, b) => {
    const cat = (d: typeof a) =>
      d.completed > 0 && d.incomplete === 0 ? 0
      : d.completed > 0 && d.incomplete > 0 ? 1
      : d.incomplete > 0 ? 2
      : d.vacations > 0 ? 3
      : d.ausencias > 0 ? 4
      : d.restDays > 0 ? 5
      : 6
    const ca = cat(a), cb = cat(b)
    return ca !== cb ? ca - cb : b.compliance - a.compliance
  })

  sortedDrivers.forEach((driver, i) => {
    const r = ws2.addRow([
      driver.nombre, driver.cedula, driver.ciudad || '—', driver.placa || '—',
      ...driver.days.map(d => statusIcon[d.status] || ''),
      `${driver.compliance}%`, driver.completed, driver.incomplete, '',
    ])
    r.height = 22

    const altFill = rowFill(i)

    // Conductor name
    const c1 = r.getCell(1)
    c1.font = { bold: true, size: 10, color: clr(NAVY), name: 'Calibri' }
    c1.fill = altFill
    c1.border = baseBorder()
    c1.alignment = { vertical: 'middle' }

    // Cédula
    const c2 = r.getCell(2)
    c2.font = { size: 9, color: clr('4A5568'), name: 'Calibri' }
    c2.fill = altFill
    c2.border = baseBorder()
    c2.alignment = { horizontal: 'center', vertical: 'middle' }

    // Ciudad
    const cCiudad = r.getCell(3)
    cCiudad.font = { size: 9, color: clr('4A5568'), name: 'Calibri' }
    cCiudad.fill = altFill
    cCiudad.border = baseBorder()
    cCiudad.alignment = { horizontal: 'center', vertical: 'middle' }

    // Placa
    const c3 = r.getCell(4)
    c3.font = { bold: true, size: 9, color: clr(NAVY), name: 'Calibri' }
    c3.fill = altFill
    c3.border = baseBorder()
    c3.alignment = { horizontal: 'center', vertical: 'middle' }

    // Day cells
    driver.days.forEach((d, j) => {
      const cell = r.getCell(5 + j)
      const sc = statusColor[d.status] || GRAY
      const sb = statusBg[d.status] || GRAY_BG
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: clr(sb) }
      cell.font = { bold: true, size: 10, color: clr(sc), name: 'Calibri' }
      cell.alignment = { horizontal: 'center', vertical: 'middle' }
      cell.border = baseBorder()
    })

    // % cumulative
    const pci = 5 + meta.totalDias
    const pctCell = r.getCell(pci)
    pctCell.font = { bold: true, size: 10, color: clr(driver.compliance >= 80 ? GREEN : driver.compliance >= 50 ? YELLOW : RED), name: 'Calibri' }
    pctCell.fill = altFill
    pctCell.alignment = { horizontal: 'center', vertical: 'middle' }
    pctCell.border = baseBorder()

    // OK
    const okCell = r.getCell(pci + 1)
    okCell.font = { bold: true, size: 10, color: clr(NAVY), name: 'Calibri' }
    okCell.fill = altFill
    okCell.alignment = { horizontal: 'center', vertical: 'middle' }
    okCell.border = baseBorder()

    // NO
    const noCell = r.getCell(pci + 2)
    noCell.font = { bold: true, size: 10, color: clr(driver.incomplete > 0 ? RED : GREEN), name: 'Calibri' }
    noCell.fill = altFill
    noCell.alignment = { horizontal: 'center', vertical: 'middle' }
    noCell.border = baseBorder()

    // Observaciones (empty)
    const obsCell = r.getCell(pci + 3)
    obsCell.fill = altFill
    obsCell.border = baseBorder()
  })

  // Freeze panes: freeze first 4 rows + first 3 columns
  ws2.views = [{ state: 'frozen', xSplit: 4, ySplit: 4 }]

  // ═══════════════════════════════════════════════════════════════
  // SHEET 3: RANKING (TOP 10 BEST / WORST)
  // ═══════════════════════════════════════════════════════════════
  const ws3 = wb.addWorksheet('Ranking', {
    pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true, margins: { left: 0.5, right: 0.5, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2 } } as any,
  })
  ws3.columns = [
    { width: 6 }, { width: 30 }, { width: 16 }, { width: 16 }, { width: 12 }, { width: 14 },
  ]

  // ── TOP 10 BEST ────────────────────────────────────────────────
  const bestTitle = ws3.addRow(['TOP 10 — MEJOR CUMPLIMIENTO'])
  ws3.mergeCells(1, 1, 1, 6)
  const btCell = bestTitle.getCell(1)
  btCell.font = { bold: true, size: 14, color: clr(WHITE), name: 'Calibri' }
  btCell.fill = { type: 'pattern', pattern: 'solid', fgColor: clr(GREEN) }
  btCell.alignment = { horizontal: 'center', vertical: 'middle' }
  bestTitle.height = 32

  const bestHRow = ws3.addRow(['#', 'CONDUCTOR', 'CÉDULA', 'CIUDAD', 'COMPLETADOS', '% CUMP.'])
  bestHRow.height = 24
  bestHRow.eachCell((cell) => {
    cell.font = { bold: true, size: 10, color: clr(WHITE), name: 'Calibri' }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: clr('166534') }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
    cell.border = baseBorder()
  })

  top10Best.forEach((d, i) => {
    const r = ws3.addRow([i + 1, d.nombre, d.cedula, d.ciudad || '—', d.completed, `${d.compliance}%`])
    r.height = 22
    r.eachCell((cell, col) => {
      cell.font = { size: 10, color: clr(NAVY), name: 'Calibri', bold: col === 1 }
      cell.alignment = { horizontal: col === 1 ? 'center' : 'left', vertical: 'middle' }
      cell.fill = rowFill(i)
      cell.border = baseBorder()
    })
    if (d.compliance >= 80) {
      r.getCell(6).font = { bold: true, size: 10, color: clr(GREEN), name: 'Calibri' }
    }
  })

  ws3.addRow([])

  // ── TOP 10 WORST ───────────────────────────────────────────────
  const worstTitle = ws3.addRow(['TOP 10 — MÁS INCUMPLIMIENTOS'])
  ws3.mergeCells(ws3.rowCount, 1, ws3.rowCount, 6)
  const wtCell = worstTitle.getCell(1)
  wtCell.font = { bold: true, size: 14, color: clr(WHITE), name: 'Calibri' }
  wtCell.fill = { type: 'pattern', pattern: 'solid', fgColor: clr(RED) }
  wtCell.alignment = { horizontal: 'center', vertical: 'middle' }
  worstTitle.height = 32

  const worstHRow = ws3.addRow(['#', 'CONDUCTOR', 'CÉDULA', 'CIUDAD', 'INCUMPLIDOS', '% CUMP.'])
  worstHRow.height = 24
  worstHRow.eachCell((cell) => {
    cell.font = { bold: true, size: 10, color: clr(WHITE), name: 'Calibri' }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: clr('C42D20') }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
    cell.border = baseBorder()
  })

  top10Worst.forEach((d, i) => {
    const r = ws3.addRow([i + 1, d.nombre, d.cedula, d.ciudad || '—', d.incomplete, `${d.compliance}%`])
    r.height = 22
    r.eachCell((cell, col) => {
      cell.font = { size: 10, color: clr(NAVY), name: 'Calibri', bold: col === 1 }
      cell.alignment = { horizontal: col === 1 ? 'center' : 'left', vertical: 'middle' }
      cell.fill = rowFill(i)
      cell.border = baseBorder()
    })
    if (d.compliance < 50) {
      r.getCell(6).font = { bold: true, size: 10, color: clr(RED), name: 'Calibri' }
    }
  })

  // ═══════════════════════════════════════════════════════════════
  // SHEET 4: CUMPLIMIENTO DIARIO
  // ═══════════════════════════════════════════════════════════════
  const ws4 = wb.addWorksheet('Cumplimiento Diario', {
    pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true } as any,
  })
  ws4.columns = [
    { width: 10 }, { width: 14 }, { width: 14 }, { width: 14 }, { width: 14 }, { width: 14 }, { width: 14 }, { width: 12 },
  ]

  // ── Title ──────────────────────────────────────────────────────
  const dTitle = ws4.addRow(['CUMPLIMIENTO DIARIO'])
  ws4.mergeCells(1, 1, 1, 8)
  const dtCell = dTitle.getCell(1)
  dtCell.font = { bold: true, size: 14, color: clr(WHITE), name: 'Calibri' }
  dtCell.fill = { type: 'pattern', pattern: 'solid', fgColor: clr(NAVY) }
  dtCell.alignment = { horizontal: 'center', vertical: 'middle' }
  dTitle.height = 32

  // ── Header ─────────────────────────────────────────────────────
  const dHRow = ws4.addRow(['DÍA', 'COMPLETADOS', 'INCUMPLIDOS', 'VACACIONES', 'AUSENCIAS', 'DESCANSO', 'TOTAL', '%'])
  dHRow.height = 24
  dHRow.eachCell((cell) => {
    cell.font = { bold: true, size: 10, color: clr(WHITE), name: 'Calibri' }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: clr(NAVY2) }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
    cell.border = baseBorder()
  })

  // ── Data ───────────────────────────────────────────────────────
  dailyCompliance.forEach((d, i) => {
    const r = ws4.addRow([
      `${d.dayName} ${d.dayNumber}`,
      d.completed, d.incomplete, d.vacation, d.ausencia, d.rest,
      d.completed + d.incomplete,
      d.pct > 0 ? `${d.pct}%` : '—',
    ])
    r.height = 22
    r.eachCell((cell) => {
      cell.font = { size: 10, color: clr(NAVY), name: 'Calibri' }
      cell.alignment = { horizontal: 'center', vertical: 'middle' }
      cell.fill = rowFill(i)
      cell.border = baseBorder()
    })
    const pctCell = r.getCell(8)
    if (d.pct >= 80) pctCell.font = { bold: true, size: 11, color: clr(GREEN), name: 'Calibri' }
    else if (d.pct >= 50) pctCell.font = { bold: true, size: 11, color: clr(YELLOW), name: 'Calibri' }
    else pctCell.font = { bold: true, size: 11, color: clr(RED), name: 'Calibri' }
  })

  // ── Generate and download ──────────────────────────────────────
  const buf = await wb.xlsx.writeBuffer()
  saveAs(
    new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    `Reporte_Ejecutivo_${meta.mes}_${meta.anio}.xlsx`,
  )
}
