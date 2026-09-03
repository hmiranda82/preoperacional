import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

interface ReportDriverDay {
  date: string
  dayName: string
  dayNumber: number
  status: 'completed' | 'incomplete' | 'vacation' | 'ausencia' | 'rest' | 'future'
}

interface ReportDriver {
  id: number
  nombre: string
  cedula: string
  placa: string | null
  ciudad: string | null
  supervisor: string | null
  tipoVehiculo: string | null
  diasLaborales: string
  days: ReportDriverDay[]
  completed: number
  incomplete: number
  vacations: number
  ausencias: number
  restDays: number
  futureDays: number
  compliance: number
  totalInspections: number
  totalIncumplimientos: number
}

interface DailyCompliance {
  date: string
  dayName: string
  dayNumber: number
  total: number
  completed: number
  incomplete: number
  vacation: number
  ausencia: number
  rest: number
  future: number
  pct: number
}

export interface ExecutiveReport {
  meta: {
    empresa: string
    mes: string
    mesNumero: number
    anio: number
    totalDias: number
    diasLaborables: number
    fechaGeneracion: string
    usuario: string
    totalConductores: number
    cumplieronHoy: number
    incumplieronHoy: number
    enVacaciones: number
    enAusencias: number
    enDescanso: number
    cumplimientoGeneral: number
    totalInspecciones: number
    totalIncumplimientos: number
  }
  drivers: ReportDriver[]
  dailyCompliance: DailyCompliance[]
  statusSummary: { completed: number; incomplete: number; vacation: number; ausencia: number; rest: number }
  top10Best: Array<{ nombre: string; cedula: string; ciudad: string | null; compliance: number; completed: number }>
  top10Worst: Array<{ nombre: string; cedula: string; ciudad: string | null; compliance: number; incomplete: number }>
}

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getExecutiveReport(params: {
    year: number
    month: number
    companyId?: number
    ciudad?: string
    supervisorId?: number
    tipoVehiculo?: string
    driverId?: number
    usuario?: string
  }): Promise<ExecutiveReport> {
    const { year, month, companyId, ciudad, tipoVehiculo, driverId, usuario } = params

    // Build date range for the month
    const firstDay = new Date(year, month - 1, 1)
    const lastDay = new Date(year, month, 0)
    const totalDias = lastDay.getDate()
    const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date())

    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
    const days: Array<{ date: string; dayName: string; dayNumber: number }> = []
    for (let d = 1; d <= totalDias; d++) {
      const dt = new Date(year, month - 1, d)
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      days.push({ date: dateStr, dayName: dayNames[dt.getDay()], dayNumber: d })
    }

    // Build driver query filters
    const driverWhere: any = { estado: 'ACTIVO' }
    if (companyId) driverWhere.user = { companyId }
    if (ciudad) driverWhere.ciudad = ciudad
    if (tipoVehiculo) driverWhere.tipoVehiculo = tipoVehiculo

    const userWhere: any = { role: 'DRIVER', isActive: true }
    if (companyId) userWhere.companyId = companyId

    // Get drivers
    const users = await this.prisma.user.findMany({
      where: { ...userWhere, ...(driverId ? { id: driverId } : {}) },
      include: {
        driver: {
          where: driverWhere,
          include: {
            responses: {
              where: {
                fecha: {
                  gte: new Date(Date.UTC(year, month - 1, 1, 5, 0, 0)),
                  lt: new Date(Date.UTC(year, month, 1, 5, 0, 0)),
                },
              },
              select: { fecha: true },
            },

            ausencias: {
              where: {
                activo: true,
                fecha: { gte: new Date(firstDay), lte: new Date(lastDay) },
              },
              select: { fecha: true, motivo: true },
            },
          },
        },
      },
    })

    // Filter to only users with driver records
    const activeDrivers = users.filter(u => u.driver)
    if (ciudad) {
      // Already filtered above via driverWhere
    }
    if (tipoVehiculo) {
      // Already filtered above via driverWhere
    }

    // Build vacation lookup sets per driver (from VacationDay)
    const vacationMap = new Map<number, Set<string>>()
    const vacationRangeMap = new Map<number, Array<{ inicio: string; fin: string }>>()
    const ausenciaMap = new Map<number, Set<string>>()
    const driverIds = activeDrivers.map(u => u.driver!.id)
    if (driverIds.length) {
      const vacDays = await this.prisma.vacationDay.findMany({
        where: {
          driverId: { in: driverIds },
          activo: true,
          vacation: { activo: true },
          fecha: { gte: firstDay, lte: lastDay },
        },
        select: { driverId: true, fecha: true },
      })
      for (const vd of vacDays) {
        const dt = this.dateStr(vd.fecha)
        if (!dt) continue
        let set = vacationMap.get(vd.driverId)
        if (!set) { set = new Set(); vacationMap.set(vd.driverId, set) }
        set.add(dt)
      }

      const vacations = await this.prisma.vacation.findMany({
        where: {
          driverId: { in: driverIds },
          activo: true,
          fechaInicio: { lte: lastDay },
          fechaFin: { gte: firstDay },
        },
        select: { driverId: true, fechaInicio: true, fechaFin: true },
      })
      for (const v of vacations) {
        const ini = this.dateStr(v.fechaInicio)
        const fin = this.dateStr(v.fechaFin)
        if (!ini || !fin) continue
        let arr = vacationRangeMap.get(v.driverId)
        if (!arr) { arr = []; vacationRangeMap.set(v.driverId, arr) }
        arr.push({ inicio: ini, fin })
      }
    }
    for (const u of activeDrivers) {
      const d = u.driver!
      if (!vacationMap.has(d.id)) vacationMap.set(d.id, new Set())
      if (!vacationRangeMap.has(d.id)) vacationRangeMap.set(d.id, [])

      const ausDates = new Set<string>()
      for (const a of d.ausencias) {
        const dt = this.dateStr(a.fecha)
        if (dt) ausDates.add(dt)
      }
      ausenciaMap.set(d.id, ausDates)
    }

    // Build response lookup: driverId → Set of date strings
    const responseMap = new Map<number, Set<string>>()
    for (const u of activeDrivers) {
      const d = u.driver!
      const dates = new Set<string>()
      for (const r of d.responses) {
        const dt = new Date(r.fecha)
        const colStr = new Intl.DateTimeFormat('en-CA', {
          timeZone: 'America/Bogota',
        }).format(dt)
        dates.add(colStr)
      }
      responseMap.set(d.id, dates)
    }

    // Check if a date is in the future (not yet today in Colombia)
    const isFuture = (dateStr: string): boolean => dateStr > todayStr

    // Per-driver work-day check using diasLaborales
    const isWorkDayForDriver = (diasLaborales: string, dateStr: string): boolean => {
      const [y, m, d] = dateStr.split('-').map(Number)
      const dayNum = new Date(y, m - 1, d).getDay() // 0=Sun, 1=Mon, ... 6=Sat
      const laboralSet = diasLaborales.split(',').map(Number)
      return laboralSet.includes(dayNum)
    }

    // Build driver report data
    const driversData: ReportDriver[] = []
    let totalCompleted = 0
    let totalIncomplete = 0
    let totalVacation = 0
    let totalAusencia = 0
    let totalRest = 0

    for (const u of activeDrivers) {
      const d = u.driver!
      const driverDiasLaborales = d.diasLaborales ?? '1,2,3,4,5'
      const driverDays: ReportDriverDay[] = []
      let comp = 0, inc = 0, vac = 0, aus = 0, rst = 0, fut = 0

      const vacDates = vacationMap.get(d.id) || new Set()
      const vacRanges = vacationRangeMap.get(d.id) || []
      const ausDates = ausenciaMap.get(d.id) || new Set()
      const respDates = responseMap.get(d.id) || new Set()

      for (const day of days) {
        if (isFuture(day.date)) {
          driverDays.push({ ...day, status: 'future' })
          fut++
        } else if (!isWorkDayForDriver(driverDiasLaborales, day.date)) {
          driverDays.push({ ...day, status: 'rest' })
          rst++
        } else if (vacDates.has(day.date)) {
          driverDays.push({ ...day, status: 'vacation' })
          vac++
        } else if (ausDates.has(day.date)) {
          driverDays.push({ ...day, status: 'ausencia' })
          aus++
        } else if (respDates.has(day.date)) {
          driverDays.push({ ...day, status: 'completed' })
          comp++
        } else if (vacRanges.some(r => day.date >= r.inicio && day.date <= r.fin)) {
          driverDays.push({ ...day, status: 'rest' })
          rst++
        } else {
          driverDays.push({ ...day, status: 'incomplete' })
          inc++
        }
      }

      const totalRelevant = comp + inc
      const compliance = totalRelevant > 0 ? Math.round((comp / totalRelevant) * 100) : 0

      driversData.push({
        id: d.id,
        nombre: d.nombre,
        cedula: d.cedula,
        placa: d.placa,
        ciudad: d.ciudad,
        supervisor: null,
        tipoVehiculo: null,
        diasLaborales: driverDiasLaborales,
        days: driverDays,
        completed: comp,
        incomplete: inc,
        vacations: vac,
        ausencias: aus,
        restDays: rst,
        futureDays: fut,
        compliance,
        totalInspections: comp,
        totalIncumplimientos: inc,
      })

      totalCompleted += comp
      totalIncomplete += inc
      totalVacation += vac
      totalAusencia += aus
      totalRest += rst
    }

    // Sort: incumplimientos first (lowest compliance), then vacations, then perfect compliance
    driversData.sort((a, b) => {
      // Drivers with incomplete days first
      if (a.incomplete > 0 && b.incomplete === 0) return -1
      if (a.incomplete === 0 && b.incomplete > 0) return 1
      // Then by compliance ascending (worst first)
      return a.compliance - b.compliance
    })

    // Daily compliance summary
    const dailyCompliance: DailyCompliance[] = days.map(day => {
      const completed  = driversData.filter(dd => dd.days.find(d => d.date === day.date)?.status === 'completed').length
      const incomplete = driversData.filter(dd => dd.days.find(d => d.date === day.date)?.status === 'incomplete').length
      const vacation   = driversData.filter(dd => dd.days.find(d => d.date === day.date)?.status === 'vacation').length
      const ausencia   = driversData.filter(dd => dd.days.find(d => d.date === day.date)?.status === 'ausencia').length
      const rest       = driversData.filter(dd => dd.days.find(d => d.date === day.date)?.status === 'rest').length
      const future     = driversData.filter(dd => dd.days.find(d => d.date === day.date)?.status === 'future').length
      const total      = completed + incomplete + vacation + ausencia + rest
      return {
        ...day,
        total,
        completed,
        incomplete,
        vacation,
        ausencia,
        rest,
        future,
        pct: total > 0 ? Math.round((completed / (completed + incomplete)) * 100) : 0,
      }
    })

    // Status summary
    const statusSummary = {
      completed: totalCompleted,
      incomplete: totalIncomplete,
      vacation: totalVacation,
      ausencia: totalAusencia,
      rest: totalRest,
    }

    // General compliance
    const totalRelevantDays = totalCompleted + totalIncomplete
    const cumplimientoGeneral = totalRelevantDays > 0
      ? Math.round((totalCompleted / totalRelevantDays) * 100)
      : 0

    // Today stats
    const todayCompletions = driversData.filter(d => {
      const todayDay = d.days.find(dd => dd.date === todayStr)
      return todayDay?.status === 'completed'
    }).length
    const todayIncompletions = driversData.filter(d => {
      const todayDay = d.days.find(dd => dd.date === todayStr)
      return todayDay?.status === 'incomplete'
    }).length
    const todayVacations = driversData.filter(d => {
      const todayDay = d.days.find(dd => dd.date === todayStr)
      return todayDay?.status === 'vacation'
    }).length
    const todayAusencias = driversData.filter(d => {
      const todayDay = d.days.find(dd => dd.date === todayStr)
      return todayDay?.status === 'ausencia'
    }).length
    const todayRests = driversData.filter(d => {
      const todayDay = d.days.find(dd => dd.date === todayStr)
      return todayDay?.status === 'rest'
    }).length

    // Top 10 best and worst (exclude drivers with zero relevant days)
    const rankedDrivers = driversData.filter(d => (d.completed + d.incomplete) > 0)
    const sorted = [...rankedDrivers].sort((a, b) => b.compliance - a.compliance)
    const top10Best = sorted.slice(0, 10).map(d => ({
      nombre: d.nombre,
      cedula: d.cedula,
      ciudad: d.ciudad,
      compliance: d.compliance,
      completed: d.completed,
    }))
    const worstSorted = [...rankedDrivers].sort((a, b) => a.compliance - b.compliance)
    const top10Worst = worstSorted.slice(0, 10).map(d => ({
      nombre: d.nombre,
      cedula: d.cedula,
      ciudad: d.ciudad,
      compliance: d.compliance,
      incomplete: d.incomplete,
    }))

    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

      return {
        meta: {
          empresa: 'PREOPERACIONAL',
          mes: monthNames[month - 1],
          mesNumero: month,
          anio: year,
          totalDias,
          diasLaborables: days.filter(d => !isFuture(d.date)).length,
          fechaGeneracion: new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' }),
          usuario: usuario || 'Administrador',
          totalConductores: driversData.length,
          cumplieronHoy: todayCompletions,
          incumplieronHoy: todayIncompletions,
          enVacaciones: todayVacations,
          enAusencias: todayAusencias,
          enDescanso: todayRests,
          cumplimientoGeneral,
          totalInspecciones: totalCompleted,
          totalIncumplimientos: driversData.filter(d => d.incomplete > 0).length,
        },
        drivers: driversData,
        dailyCompliance,
        statusSummary,
        top10Best,
        top10Worst,
      }
  }

  private dateStr(d: Date | string): string {
    if (typeof d === 'string') return d.slice(0, 10)
    const y = d.getUTCFullYear()
    const m = String(d.getUTCMonth() + 1).padStart(2, '0')
    const day = String(d.getUTCDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }
}
