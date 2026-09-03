import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateVacationDto } from './dto/create-vacation.dto'
import { UpdateVacationDto } from './dto/update-vacation.dto'
import { assertSameCompany } from '../common/tenant.util'
import type { CurrentUserData } from '../common/decorators/current-user.decorator'

@Injectable()
export class VacationsService {
  constructor(private prisma: PrismaService) {}

  /** Empresa de un conductor (vía driver.user.companyId) */
  private async getDriverCompanyId(driverId: number): Promise<number | null> {
    const d = await this.prisma.driver.findUnique({
      where:  { id: driverId },
      select: { user: { select: { companyId: true } } },
    })
    return d?.user.companyId ?? null
  }

  private serialize(v: any) {
    const days = (v.days || []).map((d: any) => ({
      id: d.id,
      fecha: d.fecha instanceof Date ? d.fecha.toISOString().slice(0, 10) : d.fecha,
      activo: d.activo,
    }))
    return {
      id: v.id,
      driverId: v.driverId,
      fechaInicio: v.fechaInicio instanceof Date ? v.fechaInicio.toISOString().slice(0, 10) : v.fechaInicio,
      fechaFin: v.fechaFin instanceof Date ? v.fechaFin.toISOString().slice(0, 10) : v.fechaFin,
      motivo: v.motivo ?? null,
      activo: v.activo,
      days,
      createdAt: v.createdAt,
      updatedAt: v.updatedAt ?? null,
      driver: v.driver ? {
        id: v.driver.id,
        nombre: v.driver.nombre,
        cedula: v.driver.cedula,
        placa: v.driver.placa,
      } : undefined,
    }
  }

  async create(dto: CreateVacationDto, caller?: CurrentUserData) {
    const driver = await this.prisma.driver.findUnique({
      where:  { id: dto.driverId },
      select: { id: true, user: { select: { companyId: true } } },
    })
    if (!driver) throw new NotFoundException('Conductor no encontrado')

    // SEGURIDAD multi-tenant: solo conductores de la empresa del ADMIN
    if (caller) assertSameCompany(caller, driver.user.companyId)

    const inicio = new Date(dto.fechaInicio)
    const fin = new Date(dto.fechaFin)
    if (inicio > fin) throw new ConflictException('La fecha de inicio debe ser anterior a la fecha fin')

    const uniqueDays = [...new Set(dto.days)].sort()
    if (!uniqueDays.length) throw new ConflictException('Debes seleccionar al menos un día de vacaciones')

    // Atómico: la limpieza de días previos y la creación de la vacación
    // se ejecutan juntas (antes un fallo a mitad dejaba días huérfanos).
    const vacation = await this.prisma.$transaction(async (tx) => {
      // Remove existing VacationDay records for these dates to avoid unique constraint violation
      await tx.vacationDay.deleteMany({
        where: {
          driverId: dto.driverId,
          fecha: { in: uniqueDays.map(f => new Date(f)) },
        },
      })

      return tx.vacation.create({
        data: {
          driverId: dto.driverId,
          fechaInicio: inicio,
          fechaFin: fin,
          motivo: dto.motivo,
          days: {
            create: uniqueDays.map(f => ({
              driverId: dto.driverId,
              fecha: new Date(f),
            })),
          },
        },
        include: {
          driver: { select: { id: true, nombre: true, cedula: true, placa: true } },
          days: true,
        },
      })
    })
    return this.serialize(vacation)
  }

  async findByRange(desde: string, hasta: string, companyId?: number) {
    const where: any = {
      activo: true,
      fechaInicio: { lte: new Date(hasta) },
      fechaFin: { gte: new Date(desde) },
    }
    if (companyId) where.driver = { user: { companyId } }
    const vacations = await this.prisma.vacation.findMany({
      where,
      include: {
        driver: { select: { id: true, nombre: true, cedula: true, placa: true } },
        days: { where: { activo: true } },
      },
      orderBy: { driverId: 'asc' },
    })
    return vacations.map(v => this.serialize(v))
  }

  async findAll(companyId?: number) {
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date())
    const where: any = {
      activo: true,
      fechaFin: { gte: new Date(today) },
    }
    if (companyId) where.driver = { user: { companyId } }
    const vacations = await this.prisma.vacation.findMany({
      where,
      include: {
        driver: { select: { id: true, nombre: true, cedula: true, placa: true } },
        days: { where: { activo: true } },
      },
      orderBy: { fechaInicio: 'desc' },
    })
    return vacations.map(v => this.serialize(v))
  }

  async findActiveByDriver(driverId: number) {
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date())
    return this.prisma.vacationDay.findFirst({
      where: {
        driverId,
        activo: true,
        fecha: new Date(today),
        vacation: { activo: true },
      },
      include: { vacation: true },
    })
  }

  async isDriverOnVacation(driverId: number, caller?: CurrentUserData): Promise<boolean> {
    if (caller) {
      if (caller.role === 'DRIVER') {
        // Un DRIVER solo puede consultar su propio estado
        const own = await this.prisma.driver.findUnique({
          where:  { userId: caller.id },
          select: { id: true },
        })
        if (!own || own.id !== driverId) {
          throw new ForbiddenException('Solo puedes consultar tu propio estado')
        }
      } else if (caller.role !== 'SUPER_ROOT') {
        assertSameCompany(caller, await this.getDriverCompanyId(driverId))
      }
    }
    const d = await this.findActiveByDriver(driverId)
    return !!d
  }

  async findOne(id: number, caller?: CurrentUserData) {
    const v = await this.prisma.vacation.findUnique({
      where: { id },
      include: {
        driver: {
          select: {
            id: true, nombre: true, cedula: true, placa: true,
            user: { select: { companyId: true } },
          },
        },
        days: { where: { activo: true } },
      },
    })
    if (!v) throw new NotFoundException(`Vacación #${id} no encontrada`)

    // SEGURIDAD multi-tenant
    if (caller) assertSameCompany(caller, (v.driver as any).user.companyId)

    return this.serialize(v)
  }

  async update(id: number, dto: UpdateVacationDto, caller?: CurrentUserData) {
    const existing = await this.prisma.vacation.findUnique({
      where:  { id },
      select: {
        id: true, driverId: true, fechaInicio: true, fechaFin: true,
        driver: { select: { user: { select: { companyId: true } } } },
      },
    })
    if (!existing) throw new NotFoundException(`Vacación #${id} no encontrada`)

    // SEGURIDAD multi-tenant: la vacación y el conductor destino deben ser de la empresa del ADMIN
    if (caller) {
      assertSameCompany(caller, (existing as any).driver.user.companyId)
      if (dto.driverId !== undefined && dto.driverId !== existing.driverId) {
        assertSameCompany(caller, await this.getDriverCompanyId(dto.driverId))
      }
    }

    const driverId = dto.driverId ?? existing.driverId
    const inicio = dto.fechaInicio ? new Date(dto.fechaInicio) : existing.fechaInicio
    const fin = dto.fechaFin ? new Date(dto.fechaFin) : existing.fechaFin
    if (inicio > fin) throw new ConflictException('La fecha de inicio debe ser anterior a la fecha fin')

    const vacation = await this.prisma.vacation.update({
      where: { id },
      data: {
        ...(dto.driverId !== undefined ? { driverId: dto.driverId } : {}),
        ...(dto.fechaInicio !== undefined ? { fechaInicio: inicio } : {}),
        ...(dto.fechaFin !== undefined ? { fechaFin: fin } : {}),
        ...(dto.motivo !== undefined ? { motivo: dto.motivo } : {}),
        ...(dto.days !== undefined ? {
          days: {
            deleteMany: {},
            create: [...new Set(dto.days)].map(f => ({
              driverId,
              fecha: new Date(f),
            })),
          },
        } : {}),
      },
      include: {
        driver: { select: { id: true, nombre: true, cedula: true, placa: true } },
        days: { where: { activo: true } },
      },
    })
    return this.serialize(vacation)
  }

  async remove(id: number, caller?: CurrentUserData) {
    const existing = await this.prisma.vacation.findUnique({
      where:  { id },
      select: { id: true, driver: { select: { user: { select: { companyId: true } } } } },
    })
    if (!existing) throw new NotFoundException(`Vacación #${id} no encontrada`)

    // SEGURIDAD multi-tenant
    if (caller) assertSameCompany(caller, (existing as any).driver.user.companyId)

    await this.prisma.vacation.delete({ where: { id } })
    return { id, _action: 'deleted' }
  }

  async cancel(id: number, caller?: CurrentUserData) {
    const existing = await this.prisma.vacation.findUnique({
      where:  { id },
      select: { id: true, driver: { select: { user: { select: { companyId: true } } } } },
    })
    if (!existing) throw new NotFoundException(`Vacación #${id} no encontrada`)

    // SEGURIDAD multi-tenant
    if (caller) assertSameCompany(caller, (existing as any).driver.user.companyId)

    const vacation = await this.prisma.vacation.update({
      where: { id },
      data: {
        activo: false,
        days: { updateMany: { where: {}, data: { activo: false } } },
      },
      include: {
        driver: { select: { id: true, nombre: true, cedula: true, placa: true } },
        days: true,
      },
    })
    return this.serialize(vacation)
  }

  async findDaysByDriverAndRange(driverId: number, desde: string, hasta: string) {
    return this.prisma.vacationDay.findMany({
      where: {
        driverId,
        activo: true,
        vacation: { activo: true },
        fecha: { gte: new Date(desde), lte: new Date(hasta) },
      },
      select: { id: true, fecha: true, vacationId: true },
    })
  }
}
