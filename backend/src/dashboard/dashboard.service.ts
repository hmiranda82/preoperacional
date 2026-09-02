import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

/**
 * DashboardService
 *
 * Endpoint compacto GET /dashboard/summary. Replica en el servidor la
 * lógica de métricas del dashboard (DashboardView.vue) pero sin mover
 * las respuestas completas de HOY al cliente, para soportar flotas
 * grandes (2000+ conductores) sin filtrar/agrupar 500 respuestas por
 * lado ni renderizar todo el payload.
 *
 * Todas las fechas usan la zona Colombia (UTC-5).
 */
const DIAS_PROXIMO = 10
const BAD_VALUES = ['NO', 'MALO', 'false']

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  // ── Helpers de fecha Colombia ──────────────────────────────

  private todayCol(): string {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date())
  }

  /** Rango UTC completo del día de hoy en Colombia */
  private dayRange() {
    const [y, m, d] = this.todayCol().split('-').map(Number)
    return {
      gte: new Date(Date.UTC(y, m - 1, d,     5, 0, 0, 0)),
      lt:  new Date(Date.UTC(y, m - 1, d + 1, 5, 0, 0, 0)),
    }
  }

  /** Días hasta vencimiento (negativo = vencido, 0 = hoy) — igual al cliente */
  private diasHastaVencimiento(iso: Date | string | null | undefined): number | null {
    if (iso === null || iso === undefined) return null
    const s = iso instanceof Date
      ? iso.toISOString().slice(0, 10)
      : String(iso).slice(0, 10)
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (!m) return null
    const exp = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
    const today = new Date(this.todayCol())
    return Math.round((exp.getTime() - today.getTime()) / 86_400_000)
  }

  /** Agrupa respuestas de hoy con novedad: respuesta → SINO malas / bool malas */
  private buildResponseBadMap(bad: any[]) {
    const map = new Map<number, {
      sino: number
      bool: { observacion: string | null }[]
      placa: string
      nombre: string
    }>()
    for (const a of bad) {
      const r = a.response
      let entry = map.get(r.id)
      if (!entry) {
        entry = {
          sino: 0,
          bool: [],
          placa: r.placa ?? '',
          nombre: r.driver?.nombre ?? 'Conductor',
        }
        map.set(r.id, entry)
      }
      const tipo = a.question?.tipo
      if (tipo === 'SINO' && a.valor === 'NO') {
        entry.sino++
      } else if ((tipo === 'BOOLEAN' || !tipo) && BAD_VALUES.includes(a.valor)) {
        entry.bool.push({ observacion: a.observacion ?? null })
      }
    }
    return map
  }

  async getSummary(companyId?: number) {
    const range = this.dayRange()

    const respWhere: any = { fecha: range }
    if (companyId) respWhere.driver = { user: { companyId } }

    const [
      drivers,          // usuarios DRIVER (con perfil de conductor)
      vacDays,          // conductores en vacaciones hoy
      respToday,        // todos los ids/respuestas de HOY (sin límite)
      lastGroups,       // última revisión por driver (agregación pesada)
      recent,           // 8 respuestas más recientes de hoy
      badAnswers,       // SOLO respuestas con novedad (query liviana)
    ] = await Promise.all([
      this.prisma.user.findMany({
        where: { role: 'DRIVER', isActive: true, ...(companyId ? { companyId } : {}) },
        include: {
          driver: {
            select: {
              id: true, nombre: true, placa: true,
              soatVigencia: true, tecniVigencia: true,
              user: { select: { id: true } },
            },
          },
        },
      }),
      this.prisma.vacationDay.findMany({
        where: {
          activo: true,
          vacation: { activo: true },
          fecha: new Date(this.todayCol()),
          driver: { user: { role: 'DRIVER', ...(companyId ? { companyId } : {}) } },
        },
        select: { driverId: true },
      }),
      this.prisma.response.findMany({
        where: respWhere,
        select: {
          id: true,
          driver: { select: { id: true, userId: true } },
        },
      }),
      this.prisma.response.groupBy({
        by: ['driverId'],
        _max: { fecha: true },
        where: respWhere,
      }),
      this.prisma.response.findMany({
        where: respWhere,
        orderBy: { fecha: 'desc' },
        take: 8,
        select: {
          id: true, fecha: true, placa: true,
          answers: { select: { valor: true, question: { select: { tipo: true } } } },
          driver: {
            select: {
              id: true, nombre: true, cedula: true,
              user: { select: { id: true } },
            },
          },
        },
      }),
      this.prisma.answer.findMany({
        where: { valor: { in: BAD_VALUES }, response: respWhere },
        select: {
          valor: true, observacion: true,
          question: { select: { tipo: true } },
          response: {
            select: {
              id: true, placa: true,
              driver: { select: { id: true, nombre: true, user: { select: { id: true } } } },
            },
          },
        },
      }),
    ])

    // ── Mapeos base ────────────────────────────────────────────
    const activeRows = drivers
      .filter(d => d.driver)
      .map(d => ({
        userId: d.id,
        driverId: d.driver!.id,
        placa: d.driver!.placa ?? null,
        nombre: d.driver!.nombre,
        soatVigencia: d.driver!.soatVigencia ?? null,
        tecniVigencia: d.driver!.tecniVigencia ?? null,
      }))

    const onVacation = new Set(vacDays.map(v => v.driverId))
    const operative = activeRows.filter(r => !onVacation.has(r.driverId))
    const totalActiveConductors = operative.length
    const totalVacationCount = onVacation.size

    // ── KPIs ho-y ──────────────────────────────────────────────
    const submittedTodayIds = new Set<number>()
    respToday.forEach(r => {
      if (r.driver?.userId != null) submittedTodayIds.add(r.driver.userId)
    })
    const todayCount = respToday.length
    const pendingCount = operative.filter(r => !submittedTodayIds.has(r.userId)).length

    const novedadUserIds = new Set<number>()
    const novedadResponseIds = new Set<number>()
    badAnswers.forEach(a => {
      const uid = a.response?.driver?.user?.id
      if (uid != null) novedadUserIds.add(uid)
      else if (a.response?.id != null) novedadResponseIds.add(a.response.id)
    })
    const conductoresConNovedad = novedadUserIds.size + novedadResponseIds.size

    const cumplPct = totalActiveConductors ? Math.round((todayCount / totalActiveConductors) * 100) : 0

    // ── Última revisión por usuario ─────────────────────────────
    const lastRevision: Record<number, string> = {}
    for (const g of lastGroups) {
      const row = activeRows.find(r => r.driverId === g.driverId)
      if (row && g._max.fecha) lastRevision[row.userId] = g._max.fecha.toISOString()
    }

    // ── Alertas (prioridad idéntica al cliente) ─────────────────
    const seen = new Set<string>()
    const items: any[] = []
    const responseBadMap = this.buildResponseBadMap(badAnswers)

    for (const [respId, e] of responseBadMap) {
      if (e.sino > 0) {
        const key = `noapto-${respId}`
        if (!seen.has(key)) {
          seen.add(key)
          items.push({
            id: respId * 1000 + 1, placa: e.placa || e.nombre, nombre: e.nombre,
            mensaje: 'NO APTO PARA CONDUCIR HOY', tipo: 'no_apto',
          })
        }
      }
      if (e.bool.length) {
        const key = `falla-${respId}`
        if (!seen.has(key)) {
          seen.add(key)
          const obs = e.bool.find(b => b.observacion)?.observacion
          items.push({
            id: respId, placa: e.placa || '—', nombre: e.nombre,
            mensaje: obs
              ? obs.toUpperCase().slice(0, 55)
              : `${e.bool.length} FALLA${e.bool.length !== 1 ? 'S' : ''} DETECTADA${e.bool.length !== 1 ? 'S' : ''}`,
            tipo: 'falla',
          })
        }
      }
    }

    operative.forEach(r => {
      if (!r.placa) return
      const soatDias = this.diasHastaVencimiento(r.soatVigencia)
      if (soatDias !== null) {
        if (soatDias < 0) {
          const key = `soat-v-${r.userId}`
          if (!seen.has(key)) {
            seen.add(key)
            items.push({
              id: r.userId * 10000 + 1, placa: r.placa, nombre: r.nombre,
              mensaje: `SOAT VENCIDO — venció hace ${Math.abs(soatDias)} día${Math.abs(soatDias) !== 1 ? 's' : ''}`,
              tipo: 'soat_vencido',
            })
          }
        } else if (soatDias <= DIAS_PROXIMO) {
          const key = `soat-p-${r.userId}`
          if (!seen.has(key)) {
            seen.add(key)
            items.push({
              id: r.userId * 10000 + 2, placa: r.placa, nombre: r.nombre,
              mensaje: soatDias === 0
                ? 'SOAT VENCE HOY'
                : `SOAT VENCE EN ${soatDias} DÍA${soatDias !== 1 ? 'S' : ''}`,
              tipo: 'soat_pronto',
            })
          }
        }
      }

      const tecnoDias = this.diasHastaVencimiento(r.tecniVigencia)
      if (tecnoDias !== null) {
        if (tecnoDias < 0) {
          const key = `tecno-v-${r.userId}`
          if (!seen.has(key)) {
            seen.add(key)
            items.push({
              id: r.userId * 10000 + 3, placa: r.placa, nombre: r.nombre,
              mensaje: `TECNO VENCIDA — venció hace ${Math.abs(tecnoDias)} día${Math.abs(tecnoDias) !== 1 ? 's' : ''}`,
              tipo: 'tecno_vencido',
            })
          }
        } else if (tecnoDias <= DIAS_PROXIMO) {
          const key = `tecno-p-${r.userId}`
          if (!seen.has(key)) {
            seen.add(key)
            items.push({
              id: r.userId * 10000 + 4, placa: r.placa, nombre: r.nombre,
              mensaje: tecnoDias === 0
                ? 'TECNO VENCE HOY'
                : `TECNO VENCE EN ${tecnoDias} DÍA${tecnoDias !== 1 ? 'S' : ''}`,
              tipo: 'tecno_pronto',
            })
          }
        }
      }
    })

    operative
      .filter(r => !submittedTodayIds.has(r.userId))
      .slice(0, 5)
      .forEach(r => {
        const key = `miss-${r.userId}`
        if (!seen.has(key)) {
          seen.add(key)
          items.push({
            id: -(r.userId), placa: r.placa || '—', nombre: r.nombre,
            mensaje: 'SIN INSPECCIÓN REGISTRADA HOY', tipo: 'missing',
          })
        }
      })

    const order: Record<string, number> = {
      no_apto: 0, soat_vencido: 1, tecno_vencido: 1, falla: 2,
      soat_pronto: 3, tecno_pronto: 3, missing: 4,
    }
    const alerts = items.sort((a, b) => order[a.tipo] - order[b.tipo]).slice(0, 10)

    // ── Recientes (8) — misma forma que el cliente ──────────────
    const recents = recent.map(r => ({
      id: r.id,
      fecha: r.fecha,
      placa: r.placa,
      user: {
        id: r.driver?.user?.id ?? null,
        nombre: r.driver?.nombre ?? null,
        cedula: r.driver?.cedula ?? null,
      },
      answers: r.answers.map(a => ({ valor: a.valor, question: a.question?.tipo != null ? { tipo: a.question.tipo } : null })),
    }))

    return {
      fecha: this.todayCol(),
      totalActiveConductors,
      totalVacationCount,
      todayCount,
      pendingCount,
      conductoresConNovedad,
      cumplPct,
      submittedTodayIds: [...submittedTodayIds],
      recent: recents,
      alerts,
      lastRevision,
    }
  }
}