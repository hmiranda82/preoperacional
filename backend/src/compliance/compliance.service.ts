import { Injectable, Logger } from '@nestjs/common'
import { Cron }                  from '@nestjs/schedule'
import { PrismaService }          from '../prisma/prisma.service'
import { VacationsService }       from '../vacations/vacations.service'
import { AusenciasService }       from '../ausencias/ausencias.service'

/**
 * ComplianceService
 *
 * Gestiona el cumplimiento diario de inspecciones preoperacionales.
 *
 * Lógica de negocio:
 * ─────────────────
 * 1. Al crear una Response: upsert DailyStatus → COMPLETADO
 * 2. Cron 23:59 Colombia (UTC+5 = 04:59 UTC): cierra el día
 *    marcando INCUMPLIDO a quienes siguen en PENDIENTE
 * 3. Al iniciar el día (opcional): crear registros PENDIENTE
 *    para todos los conductores ACTIVOS (garantiza historial completo)
 *
 * Conductores en vacaciones o con ausencia son EXCLUIDOS de métricas
 * de cumplimiento y del marcado de incumplidos.
 *
 * Zona horaria:
 *   America/Bogota = UTC-5, sin DST. Todos los rangos de fecha
 *   se calculan con offset fijo -5h.
 */
@Injectable()
export class ComplianceService {
  private readonly logger = new Logger(ComplianceService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly vacations: VacationsService,
    private readonly ausencias: AusenciasService,
  ) {}

  // ── Helpers de fecha Colombia ─────────────────────────────

  /** Fecha actual en Colombia como string YYYY-MM-DD */
  private todayCol(): string {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Bogota',
    }).format(new Date())
  }

  /**
   * Excluye IDs de conductores que están en vacaciones activas o
   * con ausencia registrada hoy.
   */
  private async excludeVacationDriverIds(driverIds: number[]): Promise<number[]> {
    if (!driverIds.length) return []
    const today = this.todayCol()
    const [vacDays, ausencias] = await Promise.all([
      this.prisma.vacationDay.findMany({
        where: {
          driverId: { in: driverIds },
          activo: true,
          vacation: { activo: true },
          fecha: new Date(today),
        },
        select: { driverId: true },
      }),
      this.prisma.ausencia.findMany({
        where: {
          driverId: { in: driverIds },
          activo: true,
          fecha: new Date(today),
        },
        select: { driverId: true },
      }),
    ])
    const excluded = new Set([
      ...vacDays.map(v => v.driverId),
      ...ausencias.map(a => a.driverId),
    ])
    return driverIds.filter(id => !excluded.has(id))
  }

  /** Rango UTC completo de un día colombiano */
  private colDayRangeUTC(yyyymmdd: string): { gte: Date; lt: Date } {
    // Colombia UTC-5: el día empieza a las 05:00 UTC y termina a las 04:59:59 UTC+1
    const [y, m, d] = yyyymmdd.split('-').map(Number)
    return {
      gte: new Date(Date.UTC(y, m - 1, d,  5, 0, 0, 0)),
      lt:  new Date(Date.UTC(y, m - 1, d + 1, 5, 0, 0, 0)),
    }
  }

  // ── Marca un conductor como COMPLETADO al enviar inspección ──

  async markCompleted(driverId: number, responseId: number): Promise<void> {
    const today = this.todayCol()
    await this.prisma.dailyStatus.upsert({
      where:  { driverId_fecha: { driverId, fecha: new Date(today) } },
      create: { driverId, fecha: new Date(today), estado: 'COMPLETADO', responseId },
      update: { estado: 'COMPLETADO', responseId },
    })
  }

  // ── Cron: cierre del día — cada día a las 23:59 Colombia ─────
  // Colombia = UTC-5 → 23:59 COT = 04:59 UTC del día siguiente

  @Cron('59 4 * * *', { timeZone: 'UTC' })   // = 23:59 America/Bogota
  async closeDayCron(): Promise<void> {
    const companies = await this.prisma.company.findMany({ select: { id: true } })
    await Promise.all(companies.map(c => this.closeDay(undefined, c.id)))
  }

  /**
   * Cierra el día actual:
   * 1. Obtiene todos los conductores ACTIVOS
   * 2. Crea/actualiza registros INCUMPLIDO para los que no enviaron
   */
  async closeDay(dateOverride?: string, companyId?: number): Promise<{
    fecha: string; incumplidos: number; completados: number
  }> {
    const fecha = dateOverride ?? this.todayCol()
    this.logger.log(`Cerrando día ${fecha}${companyId ? ' (empresa #' + companyId + ')' : ''}`)

    const driverWhere: any = { estado: 'ACTIVO' }
    if (companyId) driverWhere.user = { companyId }

    // Conductores activos
    const drivers = await this.prisma.driver.findMany({
      where: driverWhere,
      select: { id: true },
    })

    // Excluir conductores en vacaciones
    const activeDriverIds = await this.excludeVacationDriverIds(drivers.map(d => d.id))
    const activeDrivers = drivers.filter(d => activeDriverIds.includes(d.id))

    // Los que ya tienen COMPLETADO ese día
    const completados = await this.prisma.dailyStatus.findMany({
      where: {
        fecha:  new Date(fecha),
        estado: 'COMPLETADO',
      },
      select: { driverId: true },
    })
    const completadosSet = new Set(completados.map(c => c.driverId))

    const incumplidosDrivers = activeDrivers.filter(d => !completadosSet.has(d.id))

    if (incumplidosDrivers.length) {
      await this.prisma.$transaction(
        incumplidosDrivers.map(d =>
          this.prisma.dailyStatus.upsert({
            where:  { driverId_fecha: { driverId: d.id, fecha: new Date(fecha) } },
            create: { driverId: d.id, fecha: new Date(fecha), estado: 'INCUMPLIDO' },
            update: { estado: 'INCUMPLIDO' },
          })
        )
      )
    }

    this.logger.log(`Día ${fecha} cerrado — incumplidos: ${incumplidosDrivers.length}`)

    return {
      fecha,
      incumplidos: incumplidosDrivers.length,
      completados:  completadosSet.size,
    }
  }

  // ── Consultas ─────────────────────────────────────────────

  /** Estado del día de hoy: para el dashboard */
  async getTodayStatus(companyId?: number): Promise<{
    fecha: string
    total: number
    completados: number
    pendientes: number
    incumplidos: number
    porcentaje: number
    detalle: Array<{
      driverId: number; nombre: string; cedula: string; placa: string | null
      estado: string; horaInspeccion: string | null
    }>
  }> {
    const fecha = this.todayCol()
    const driverWhere: any = { estado: 'ACTIVO' }
    if (companyId) driverWhere.user = { companyId }

    let drivers = await this.prisma.driver.findMany({
      where: driverWhere,
      include: {
        dailyStatuses: {
          where: { fecha: new Date(fecha) },
          include: { response: { select: { fecha: true } } },
        },
      },
    })

    // Excluir conductores en vacaciones
    const activeIds = await this.excludeVacationDriverIds(drivers.map(d => d.id))
    drivers = drivers.filter(d => activeIds.includes(d.id))

    const detalle = drivers.map(d => {
      const ds = d.dailyStatuses[0]
      return {
        driverId:       d.id,
        nombre:         d.nombre,
        cedula:         d.cedula,
        placa:          d.placa ?? null,
        estado:         ds?.estado ?? 'PENDIENTE',
        horaInspeccion: ds?.response?.fecha
          ? new Intl.DateTimeFormat('es-CO', {
              hour: '2-digit', minute: '2-digit',
              timeZone: 'America/Bogota',
            }).format(new Date(ds.response.fecha))
          : null,
      }
    })

    const completados  = detalle.filter(d => d.estado === 'COMPLETADO').length
    const incumplidos  = detalle.filter(d => d.estado === 'INCUMPLIDO').length
    const pendientes   = detalle.filter(d => d.estado === 'PENDIENTE').length
    const total        = drivers.length
    const porcentaje   = total ? Math.round((completados / total) * 100) : 0

    return { fecha, total, completados, pendientes, incumplidos, porcentaje, detalle }
  }

  /** Historial de cumplimiento — últimos N días */
  async getHistory(days = 14, companyId?: number): Promise<Array<{
    fecha: string; completados: number; incumplidos: number; pendientes: number; porcentaje: number
  }>> {
    const today = new Date(this.todayCol())
    const from  = new Date(today)
    from.setDate(from.getDate() - days + 1)

    const where: any = {
      fecha: { gte: from, lte: today },
      driver: { estado: 'ACTIVO' },
    }
    if (companyId) where.driver.user = { companyId }

    const records = await this.prisma.dailyStatus.groupBy({
      by: ['fecha', 'estado'],
      where,
      _count: { estado: true },
    })

    // Group by date
    const map = new Map<string, { completados: number; incumplidos: number; pendientes: number }>()
    records.forEach(r => {
      const key = r.fecha.toISOString().slice(0, 10)
      if (!map.has(key)) map.set(key, { completados: 0, incumplidos: 0, pendientes: 0 })
      const entry = map.get(key)!
      if (r.estado === 'COMPLETADO')  entry.completados  += r._count.estado
      if (r.estado === 'INCUMPLIDO')  entry.incumplidos  += r._count.estado
      if (r.estado === 'PENDIENTE')   entry.pendientes   += r._count.estado
    })

    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([fecha, v]) => {
        const total = v.completados + v.incumplidos + v.pendientes
        return {
          fecha,
          ...v,
          porcentaje: total ? Math.round((v.completados / total) * 100) : 0,
        }
      })
  }

  /** Historial de incumplimientos de un conductor específico */
  async getDriverHistory(driverId: number, days = 30): Promise<Array<{
    fecha: string; estado: string; horaInspeccion: string | null
  }>> {
    const today = new Date(this.todayCol())
    const from  = new Date(today)
    from.setDate(from.getDate() - days + 1)

    const records = await this.prisma.dailyStatus.findMany({
      where: { driverId, fecha: { gte: from, lte: today } },
      include: { response: { select: { fecha: true } } },
      orderBy: { fecha: 'desc' },
    })

    return records.map(r => ({
      fecha:          r.fecha.toISOString().slice(0, 10),
      estado:         r.estado,
      horaInspeccion: r.response?.fecha
        ? new Intl.DateTimeFormat('es-CO', {
            hour: '2-digit', minute: '2-digit',
            timeZone: 'America/Bogota',
          }).format(new Date(r.response.fecha))
        : null,
    }))
  }

  /** Lista de conductores INCUMPLIDOS hoy o en un día dado */
  async getIncumplidos(fecha?: string, companyId?: number): Promise<Array<{
    driverId: number; nombre: string; cedula: string; placa: string | null; fecha: string
  }>> {
    const day = fecha ?? this.todayCol()
    const where: any = { fecha: new Date(day), estado: 'INCUMPLIDO' }
    if (companyId) where.driver = { user: { companyId } }
    const records = await this.prisma.dailyStatus.findMany({
      where,
      include: { driver: { select: { id: true, nombre: true, cedula: true, placa: true } } },
      orderBy: { driver: { nombre: 'asc' } },
    })
    // Exclude vacation drivers from incumplidos list
    const activeIds = await this.excludeVacationDriverIds(records.map(r => r.driver.id))
    return records
      .filter(r => activeIds.includes(r.driver.id))
      .map(r => ({
      driverId: r.driver.id,
      nombre:   r.driver.nombre,
      cedula:   r.driver.cedula,
      placa:    r.driver.placa ?? null,
      fecha:    day,
    }))
  }
}