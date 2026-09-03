import { Test } from '@nestjs/testing'
import { ForbiddenException, NotFoundException } from '@nestjs/common'
import { ComplianceService } from './compliance.service'
import { PrismaService } from '../prisma/prisma.service'
import { VacationsService } from '../vacations/vacations.service'
import { AusenciasService } from '../ausencias/ausencias.service'

describe('ComplianceService', () => {
  let service: ComplianceService
  let prisma: {
    driver: { findMany: jest.Mock; findUnique: jest.Mock }
    dailyStatus: { findMany: jest.Mock; upsert: jest.Mock }
    vacationDay: { findMany: jest.Mock }
    ausencia: { findMany: jest.Mock }
    company: { findMany: jest.Mock }
    $transaction: jest.Mock
  }

  const callerCo1 = { id: 10, email: 'a@x.com', role: 'ADMIN', companyId: 1 }
  const callerCo2 = { id: 11, email: 'b@x.com', role: 'ADMIN', companyId: 2 }

  beforeEach(async () => {
    prisma = {
      driver: { findMany: jest.fn(), findUnique: jest.fn() },
      dailyStatus: { findMany: jest.fn(), upsert: jest.fn() },
      vacationDay: { findMany: jest.fn().mockResolvedValue([]) },
      ausencia: { findMany: jest.fn().mockResolvedValue([]) },
      company: { findMany: jest.fn() },
      $transaction: jest.fn(),
    }

    const moduleRef = await Test.createTestingModule({
      providers: [
        ComplianceService,
        { provide: PrismaService, useValue: prisma },
        { provide: VacationsService, useValue: { findActiveByDriver: jest.fn().mockResolvedValue(null) } },
        { provide: AusenciasService, useValue: { findActiveByDriver: jest.fn().mockResolvedValue(null) } },
      ],
    }).compile()

    service = moduleRef.get(ComplianceService)
  })

  describe('closeDay', () => {
    it('marca INCUMPLIDO solo a los activos sin COMPLETADO', async () => {
      prisma.driver.findMany.mockResolvedValue([{ id: 1 }, { id: 2 }, { id: 3 }])
      prisma.dailyStatus.findMany.mockResolvedValue([{ driverId: 1 }]) // 1 completó
      prisma.$transaction.mockResolvedValue([])

      const result = await service.closeDay('2026-09-01', 1)

      expect(result.incumplidos).toBe(2)
      expect(prisma.$transaction).toHaveBeenCalledTimes(1)
      const upserts = prisma.$transaction.mock.calls[0][0]
      expect(upserts).toHaveLength(2)
    })

    it('no marca nada si todos los conductores cumplieron', async () => {
      prisma.driver.findMany.mockResolvedValue([{ id: 1 }])
      prisma.dailyStatus.findMany.mockResolvedValue([{ driverId: 1 }])

      const result = await service.closeDay('2026-09-01', 1)

      expect(result.incumplidos).toBe(0)
      expect(result.completados).toBe(1)
      expect(prisma.$transaction).not.toHaveBeenCalled()
    })

    it('filtra por empresa cuando se indica companyId', async () => {
      prisma.driver.findMany.mockResolvedValue([])
      prisma.dailyStatus.findMany.mockResolvedValue([])

      await service.closeDay('2026-09-01', 7)

      expect(prisma.driver.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ estado: 'ACTIVO', user: { companyId: 7 } }) }),
      )
    })
  })

  describe('closeDayCron', () => {
    it('un fallo en una empresa no bloquea ni rompe el cierre de las demás', async () => {
      prisma.company.findMany.mockResolvedValue([{ id: 1 }, { id: 2 }])
      const spy = jest.spyOn(service, 'closeDay')
        .mockResolvedValueOnce({ fecha: '2026-09-01', incumplidos: 0, completados: 5 })
        .mockRejectedValueOnce(new Error('BD caída'))

      await expect(service.closeDayCron()).resolves.toBeUndefined()

      expect(spy).toHaveBeenCalledTimes(2)
      expect(spy.mock.calls[0][1]).toBe(1)
      expect(spy.mock.calls[1][1]).toBe(2)
    })
  })

  describe('getDriverHistory (aislamiento multi-tenant)', () => {
    const record = {
      fecha: new Date('2026-09-01T12:00:00Z'),
      estado: 'COMPLETADO',
      response: { fecha: new Date('2026-09-01T13:30:00Z') },
    }

    it('bloquea con 403 al ADMIN que consulta un conductor de otra empresa', async () => {
      prisma.driver.findUnique.mockResolvedValue({ user: { companyId: 1 } })

      await expect(service.getDriverHistory(5, 30, callerCo2)).rejects.toThrow(ForbiddenException)
    })

    it('bloquea con 404 si el conductor no existe', async () => {
      prisma.driver.findUnique.mockResolvedValue(null)

      await expect(service.getDriverHistory(999, 30, callerCo1)).rejects.toThrow(NotFoundException)
    })

    it('devuelve el historial para el ADMIN de la misma empresa', async () => {
      prisma.driver.findUnique.mockResolvedValue({ user: { companyId: 1 } })
      prisma.dailyStatus.findMany.mockResolvedValue([record])

      const result = await service.getDriverHistory(5, 30, callerCo1)

      expect(result).toHaveLength(1)
      expect(result[0].estado).toBe('COMPLETADO')
      // 13:30 UTC = 08:30 Bogotá (es-CO puede añadir "a. m.")
      expect(result[0].horaInspeccion).toContain('08:30')
    })
  })

  describe('getIncumplidos', () => {
    it('excluye de la lista a conductores en vacaciones/ausencia', async () => {
      prisma.dailyStatus.findMany.mockResolvedValue([
        { driver: { id: 1, nombre: 'A', cedula: '1', placa: 'AAA111' } },
        { driver: { id: 2, nombre: 'B', cedula: '2', placa: 'BBB222' } },
      ])
      // El helper interno consulta vacationDay/ausencia; devolvemos que el 2 está de vacaciones
      prisma.vacationDay.findMany.mockResolvedValue([{ driverId: 2 }])
      prisma.ausencia.findMany.mockResolvedValue([])

      const result = await service.getIncumplidos('2026-09-01', 1)

      expect(result.map((r) => r.driverId)).toEqual([1])
    })
  })

  describe('markCompleted', () => {
    it('hace upsert a COMPLETADO con el responseId', async () => {
      prisma.dailyStatus.upsert.mockResolvedValue({})

      await service.markCompleted(3, 77)

      expect(prisma.dailyStatus.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({ estado: 'COMPLETADO', responseId: 77 }),
          update: expect.objectContaining({ estado: 'COMPLETADO', responseId: 77 }),
        }),
      )
    })
  })
})
