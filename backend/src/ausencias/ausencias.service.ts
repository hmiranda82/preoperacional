import { Injectable, NotFoundException, ConflictException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateAusenciaDto } from './dto/create-ausencia.dto'
import { UpdateAusenciaDto } from './dto/update-ausencia.dto'

@Injectable()
export class AusenciasService {
  constructor(private prisma: PrismaService) {}

  private serialize(a: any) {
    return {
      id: a.id,
      driverId: a.driverId,
      fecha: a.fecha instanceof Date ? a.fecha.toISOString().slice(0, 10) : a.fecha,
      motivo: a.motivo ?? null,
      activo: a.activo,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt ?? null,
      driver: a.driver ? {
        id: a.driver.id,
        nombre: a.driver.nombre,
        cedula: a.driver.cedula,
        placa: a.driver.placa,
      } : undefined,
    }
  }

  async create(dto: CreateAusenciaDto) {
    const driver = await this.prisma.driver.findUnique({ where: { id: dto.driverId } })
    if (!driver) throw new NotFoundException('Conductor no encontrado')

    const fecha = new Date(dto.fecha)

    const existing = await this.prisma.ausencia.findUnique({
      where: { driverId_fecha: { driverId: dto.driverId, fecha } },
    })
    if (existing) {
      throw new ConflictException('El conductor ya tiene una ausencia registrada en esa fecha')
    }

    const ausencia = await this.prisma.ausencia.create({
      data: {
        driverId: dto.driverId,
        fecha,
        motivo: dto.motivo,
      },
      include: { driver: { select: { id: true, nombre: true, cedula: true, placa: true } } },
    })
    return this.serialize(ausencia)
  }

  async findByRange(desde: string, hasta: string, companyId?: number) {
    const where: any = {
      activo: true,
      fecha: { gte: new Date(desde), lte: new Date(hasta) },
    }
    if (companyId) where.driver = { user: { companyId } }
    const ausencias = await this.prisma.ausencia.findMany({
      where,
      include: { driver: { select: { id: true, nombre: true, cedula: true, placa: true } } },
      orderBy: { fecha: 'asc' },
    })
    return ausencias.map(a => this.serialize(a))
  }

  async findAll(companyId?: number) {
    const where: any = { activo: true }
    if (companyId) where.driver = { user: { companyId } }
    const ausencias = await this.prisma.ausencia.findMany({
      where,
      include: { driver: { select: { id: true, nombre: true, cedula: true, placa: true } } },
      orderBy: { fecha: 'desc' },
    })
    return ausencias.map(a => this.serialize(a))
  }

  async findActiveByDriver(driverId: number) {
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date())
    return this.prisma.ausencia.findFirst({
      where: {
        driverId,
        activo: true,
        fecha: new Date(today),
      },
    })
  }

  async isDriverOnAusencia(driverId: number): Promise<boolean> {
    const a = await this.findActiveByDriver(driverId)
    return !!a
  }

  async findActive(driverId: number) {
    return this.findActiveByDriver(driverId)
  }

  async findOne(id: number) {
    const a = await this.prisma.ausencia.findUnique({
      where: { id },
      include: { driver: { select: { id: true, nombre: true, cedula: true, placa: true } } },
    })
    if (!a) throw new NotFoundException(`Ausencia #${id} no encontrada`)
    return this.serialize(a)
  }

  async update(id: number, dto: UpdateAusenciaDto) {
    const existing = await this.prisma.ausencia.findUnique({ where: { id } })
    if (!existing) throw new NotFoundException(`Ausencia #${id} no encontrada`)

    const driverId = dto.driverId ?? existing.driverId
    const fecha = dto.fecha ? new Date(dto.fecha) : existing.fecha

    const dup = await this.prisma.ausencia.findFirst({
      where: { driverId, fecha, id: { not: id } },
    })
    if (dup) {
      throw new ConflictException('El conductor ya tiene una ausencia en esa fecha')
    }

    const ausencia = await this.prisma.ausencia.update({
      where: { id },
      data: {
        ...(dto.driverId !== undefined ? { driverId: dto.driverId } : {}),
        ...(dto.fecha !== undefined ? { fecha } : {}),
        ...(dto.motivo !== undefined ? { motivo: dto.motivo } : {}),
      },
      include: { driver: { select: { id: true, nombre: true, cedula: true, placa: true } } },
    })
    return this.serialize(ausencia)
  }

  async remove(id: number) {
    const existing = await this.prisma.ausencia.findUnique({ where: { id } })
    if (!existing) throw new NotFoundException(`Ausencia #${id} no encontrada`)
    await this.prisma.ausencia.delete({ where: { id } })
    return { id, _action: 'deleted' }
  }

  async cancel(id: number) {
    const existing = await this.prisma.ausencia.findUnique({ where: { id } })
    if (!existing) throw new NotFoundException(`Ausencia #${id} no encontrada`)
    const ausencia = await this.prisma.ausencia.update({
      where: { id },
      data: { activo: false },
      include: { driver: { select: { id: true, nombre: true, cedula: true, placa: true } } },
    })
    return this.serialize(ausencia)
  }
}
