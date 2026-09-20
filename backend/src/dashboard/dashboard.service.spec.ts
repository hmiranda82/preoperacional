import { Test } from '@nestjs/testing'
import { DashboardService, esDiaLaboral } from './dashboard.service'
import { PrismaService } from '../prisma/prisma.service'

interface DriverRow {
  id: number
  role: string
  isActive: boolean
  driver: {
    id: number
    nombre: string
    placa: string | null
    soatVigencia: null
    tecniVigencia: null
    diasLaborales: string
    user: { id: number }
  }
}

interface RespTodayRow {
  id: number
  driver: { id: number; userId: number } | null
}

describe('DashboardService', () => {
  let service: DashboardService
  let prisma: {
    user: { findMany: jest.Mock }
    vacationDay: { findMany: jest.Mock }
    response: { findMany: jest.Mock; groupBy: jest.Mock }
    answer: { findMany: jest.Mock }
    ausencia: { findMany: jest.Mock }
  }

  function driverRow(opts: {
    driverId: number
    userId: number
    placa?: string | null
    nombre?: string
    diasLaborales?: string
  }): DriverRow {
    return {
      id: opts.userId,
      role: 'DRIVER',
      isActive: true,
      driver: {
        id: opts.driverId,
        nombre: opts.nombre ?? `Conductor ${opts.driverId}`,
        placa: opts.placa ?? null,
        soatVigencia: null,
        tecniVigencia: null,
        diasLaborales: opts.diasLaborales ?? '1,2,3,4,5',
        user: { id: opts.userId },
      },
    }
  }

  async function runSummary(overrides: {
    drivers?: DriverRow[]
    vacDays?: { driverId: number }[]
    ausDays?: { driverId: number }[]
    respToday?: RespTodayRow[]
  } = {}) {
    prisma.user.findMany.mockResolvedValue(overrides.drivers ?? [])
    prisma.vacationDay.findMany.mockResolvedValue(overrides.vacDays ?? [])
    prisma.ausencia.findMany.mockResolvedValue(overrides.ausDays ?? [])
    const respToday = overrides.respToday ?? []
    prisma.response.findMany.mockImplementation((args?: { take?: number }) => {
      if (args?.take === 8) return Promise.resolve([]) // recientes
      return Promise.resolve(respToday) // respuestas de hoy
    })
    return service.getSummary(undefined)
  }

  beforeEach(async () => {
    prisma = {
      user: { findMany: jest.fn() },
      vacationDay: { findMany: jest.fn().mockResolvedValue([]) },
      response: { findMany: jest.fn(), groupBy: jest.fn().mockResolvedValue([]) },
      answer: { findMany: jest.fn().mockResolvedValue([]) },
      ausencia: { findMany: jest.fn().mockResolvedValue([]) },
    }

    const moduleRef = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile()

    service = moduleRef.get(DashboardService)
  })

  describe('esDiaLaboral (matriz de jornadas)', () => {
    it('lunes a viernes: sábado y domingo NO son laborales; entre semana sí', () => {
      expect(esDiaLaboral('1,2,3,4,5', '2026-09-19')).toBe(false) // Sábado
      expect(esDiaLaboral('1,2,3,4,5', '2026-09-20')).toBe(false) // Domingo
      expect(esDiaLaboral('1,2,3,4,5', '2026-09-21')).toBe(true)  // Lunes
      expect(esDiaLaboral('1,2,3,4,5', '2026-09-22')).toBe(true)  // Martes
      expect(esDiaLaboral('1,2,3,4,5', '2026-09-23')).toBe(true)  // Miércoles
      expect(esDiaLaboral('1,2,3,4,5', '2026-09-24')).toBe(true)  // Jueves
    })

    it('lunes a sábado: sábado es laboral, domingo NO', () => {
      expect(esDiaLaboral('1,2,3,4,5,6', '2026-09-19')).toBe(true)  // Sábado
      expect(esDiaLaboral('1,2,3,4,5,6', '2026-09-20')).toBe(false) // Domingo
    })

    it('descanso entre semana (martes y jueves): miércoles NO es laboral', () => {
      expect(esDiaLaboral('2,4', '2026-09-22')).toBe(true)  // Martes
      expect(esDiaLaboral('2,4', '2026-09-23')).toBe(false) // Miércoles
      expect(esDiaLaboral('2,4', '2026-09-24')).toBe(true)  // Jueves
    })

    it('jornadas de un solo día (solo domingo / solo sábado)', () => {
      expect(esDiaLaboral('0', '2026-09-20')).toBe(true)  // Domingo
      expect(esDiaLaboral('6', '2026-09-19')).toBe(true)  // Sábado
      expect(esDiaLaboral('6', '2026-09-20')).toBe(false) // Domingo
    })

    it('cadena vacía y fechas malformadas no son laborales', () => {
      expect(esDiaLaboral('', '2026-09-21')).toBe(false)
      expect(esDiaLaboral('1,2,3,4,5', 'no-es-fecha')).toBe(false)
    })

    it('un cambio de jornada altera el resultado (viernes -> sábado)', () => {
      expect(esDiaLaboral('1,2,3,4,5', '2026-09-19')).toBe(false) // Sábado con L-V
      expect(esDiaLaboral('1,2,3,4,5,6', '2026-09-19')).toBe(true) // Sábado tras ampliar a L-S
    })
  })

  describe('getSummary — alerta SIN INSPECCIÓN REGISTRADA HOY', () => {
    // Los conductores usan jornada "0,1,2,3,4,5,6" (todos los días) para que la
    // prueba no dependa del día real en que se ejecuta; la matriz de días
    // laborales queda cubierta por los unit tests de esDiaLaboral.
    const TODOS_LOS_DIAS = '0,1,2,3,4,5,6'

    it('genera alerta y pendiente cuando debía trabajar y no inspeccionó', async () => {
      const res = await runSummary({
        drivers: [driverRow({ driverId: 1, userId: 10, placa: 'QQK57D', diasLaborales: TODOS_LOS_DIAS })],
      })

      expect(res.pendingCount).toBe(1)
      const miss = res.alerts.filter(a => a.tipo === 'missing')
      expect(miss).toHaveLength(1)
      expect(miss[0].placa).toBe('QQK57D')
    })

    it('NO alerta ni pendiente si tiene ausencia registrada hoy', async () => {
      const res = await runSummary({
        drivers: [driverRow({ driverId: 1, userId: 10, placa: 'QQK57D', diasLaborales: TODOS_LOS_DIAS })],
        ausDays: [{ driverId: 1 }],
      })

      expect(res.alerts.some(a => a.tipo === 'missing')).toBe(false)
      expect(res.pendingCount).toBe(0)
    })

    it('NO alerta ni pendiente si está de vacaciones hoy', async () => {
      const res = await runSummary({
        drivers: [driverRow({ driverId: 1, userId: 10, placa: 'QQK57D', diasLaborales: TODOS_LOS_DIAS })],
        vacDays: [{ driverId: 1 }],
      })

      expect(res.alerts.some(a => a.tipo === 'missing')).toBe(false)
      expect(res.pendingCount).toBe(0)
      expect(res.totalVacationCount).toBe(1)
    })

    it('NO alerta ni pendiente si debía trabajar y SÍ inspeccionó', async () => {
      const res = await runSummary({
        drivers: [driverRow({ driverId: 1, userId: 10, placa: 'QQK57D', diasLaborales: TODOS_LOS_DIAS })],
        respToday: [{ id: 500, driver: { id: 1, userId: 10 } }],
      })

      expect(res.alerts.some(a => a.tipo === 'missing')).toBe(false)
      expect(res.pendingCount).toBe(0)
      expect(res.todayCount).toBe(1)
      expect(res.cumplPct).toBe(100)
    })

    it('evalúa jornada, ausencia y vacaciones por cada conductor', async () => {
      const res = await runSummary({
        drivers: [
          driverRow({ driverId: 1, userId: 10, placa: 'AAA111', diasLaborales: TODOS_LOS_DIAS }),
          driverRow({ driverId: 2, userId: 20, placa: 'BBB222', diasLaborales: TODOS_LOS_DIAS }),
          driverRow({ driverId: 3, userId: 30, placa: 'CCC333', diasLaborales: TODOS_LOS_DIAS }),
          driverRow({ driverId: 4, userId: 40, placa: 'DDD444', diasLaborales: TODOS_LOS_DIAS }),
        ],
        ausDays: [{ driverId: 2 }],
        vacDays: [{ driverId: 3 }],
        respToday: [{ id: 7, driver: { id: 4, userId: 40 } }],
      })

      // Con jornada hoy y sin exclusión: solo 1 y 4 (el 4 completó, el 1 no)
      expect(res.totalActiveConductors).toBe(2)
      expect(res.pendingCount).toBe(1)
      const miss = res.alerts.filter(a => a.tipo === 'missing')
      expect(miss).toHaveLength(1)
      expect(miss[0].placa).toBe('AAA111')
      expect(res.alerts.some(a => a.tipo === 'missing' && a.placa === 'BBB222')).toBe(false)
      expect(res.alerts.some(a => a.tipo === 'missing' && a.placa === 'CCC333')).toBe(false)
    })
  })
})