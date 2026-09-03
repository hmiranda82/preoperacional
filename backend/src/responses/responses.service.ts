import {
  ConflictException,
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common'
import { PrismaService }    from '../prisma/prisma.service'
import { ComplianceService } from '../compliance/compliance.service'
import { VacationsService }  from '../vacations/vacations.service'
import { AusenciasService }  from '../ausencias/ausencias.service'
import { CreateResponseDto } from './dto/create-response.dto'
import { assertSameCompany } from '../common/tenant.util'
import type { CurrentUserData } from '../common/decorators/current-user.decorator'

const RESPONSE_INCLUDE = {
  answers: {
    include: {
      question: { select: { id: true, texto: true, tipo: true } },
    },
  },
  driver: {
    include: {
      user: { select: { id: true, email: true, role: true } },
    },
  },
  form: { select: { id: true, nombre: true } },
} as const

@Injectable()
export class ResponsesService {
  constructor(
    private prisma:     PrismaService,
    private compliance: ComplianceService,
    private vacations:  VacationsService,
    private ausencias:  AusenciasService,
  ) {}

  // ── Helpers de fecha Colombia ──────────────────────────────

  private todayCol(): string {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date())
  }

  /** Rango UTC completo de HOY en Colombia */
  private getDayRange(date = new Date()) {
    const str = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(date)
    const [y, m, d] = str.split('-').map(Number)
    return {
      gte: new Date(Date.UTC(y, m - 1, d,     5, 0, 0, 0)),
      lt:  new Date(Date.UTC(y, m - 1, d + 1, 5, 0, 0, 0)),
    }
  }

  private async getDriverId(userId: number): Promise<number> {
    const driver = await this.prisma.driver.findUnique({
      where:  { userId },
      select: { id: true },
    })
    if (!driver) throw new ForbiddenException('El usuario no tiene perfil de conductor')
    return driver.id
  }

  private serializeResponse(response: any) {
    const driver = response.driver
    const userId = driver?.user?.id ?? null
    return {
      ...response,
      userId,
      user: {
        id:     userId,
        email:  driver?.user?.email ?? null,
        role:   driver?.user?.role  ?? null,
        rol:    driver?.user?.role === 'DRIVER' ? 'CONDUCTOR' : (driver?.user?.role ?? null),
        nombre: driver?.nombre ?? null,
        cedula: driver?.cedula ?? null,
        placa:  driver?.placa  ?? null,
      },
    }
  }

  // ── CREATE — reglas estrictas de negocio ──────────────────

  async create(dto: CreateResponseDto, userId: number) {
    const driverId = await this.getDriverId(userId)

    // REGLA 0: Conductor en vacaciones no puede inspeccionar
    const onVacation = await this.vacations.isDriverOnVacation(driverId)
    if (onVacation) {
      throw new ForbiddenException('No puedes realizar la inspección porque estás en período de vacaciones.')
    }

    // REGLA 0b: Conductor con ausencia registrada no puede inspeccionar
    const onAusencia = await this.ausencias.isDriverOnAusencia(driverId)
    if (onAusencia) {
      throw new ForbiddenException('No puedes realizar la inspección porque tienes una ausencia registrada hoy.')
    }

    // REGLA 1: Solo se permite una inspección por día (ya existía)
    const yaInspecciono = await this.prisma.response.findFirst({
      where: { driverId, fecha: this.getDayRange() },
    })
    if (yaInspecciono) {
      throw new ConflictException(
        'Ya realizaste tu inspección preoperacional hoy. Solo se permite una por día.',
      )
    }

    // REGLA 2: No se puede registrar inspecciones en fechas pasadas.
    // La fecha siempre se toma del servidor (ignoramos cualquier fecha
    // que pudiera venir en el DTO). Si el cliente intenta manipularla,
    // el campo `fecha` de Prisma usa @default(now()) y aquí lo forzamos.
    const { answers, ...responseData } = dto

    // REGLA 1 re-verificada DENTRO de una transacción serializable: cierra la
    // carrera en la que dos submits simultáneos pasan el check inicial y crean
    // dos inspecciones el mismo día.
    const response = await this.prisma.$transaction(
      async (tx) => {
        const duplicada = await tx.response.findFirst({
          where: { driverId, fecha: this.getDayRange() },
          select: { id: true },
        })
        if (duplicada) {
          throw new ConflictException(
            'Ya realizaste tu inspección preoperacional hoy. Solo se permite una por día.',
          )
        }
        return tx.response.create({
          data: {
            ...responseData,
            driverId,
            fecha: new Date(),        // siempre la fecha/hora actual del servidor
            placa: responseData.placa?.toUpperCase().trim(),
            answers: { create: answers },
          },
          include: RESPONSE_INCLUDE,
        })
      },
      { isolationLevel: 'Serializable' },
    )

    // REGLA 3: Marcar como COMPLETADO en daily_status (upsert)
    await this.compliance.markCompleted(driverId, response.id)

    return this.serializeResponse(response)
  }

  async checkInspeccionHoy(userId: number) {
    const driver = await this.prisma.driver.findUnique({
      where:  { userId },
      select: { id: true },
    })
    if (!driver) return { realizada: false, inspeccion: null, enVacaciones: false, enAusencia: false }

    const [onVacation, onAusencia] = await Promise.all([
      this.vacations.isDriverOnVacation(driver.id),
      this.ausencias.isDriverOnAusencia(driver.id),
    ])
    if (onVacation) {
      return { realizada: false, inspeccion: null, enVacaciones: true, enAusencia: false }
    }
    if (onAusencia) {
      const a = await this.ausencias.findActive(driver.id)
      return {
        realizada: false, inspeccion: null, enVacaciones: false,
        enAusencia: true,
        ausencia: a ? { fecha: a.fecha instanceof Date ? new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(a.fecha) : String(a.fecha).split('T')[0], motivo: a.motivo } : null,
      }
    }

    const inspeccion = await this.prisma.response.findFirst({
      where:  { driverId: driver.id, fecha: this.getDayRange() },
      select: {
        id: true, placa: true, ciudad: true, fecha: true,
        form: { select: { id: true, nombre: true } },
      },
    })
    return { realizada: !!inspeccion, inspeccion: inspeccion ?? null, enVacaciones: false, enAusencia: false }
  }

  async findAll(companyId?: number) {
    const where: any = {}
    if (companyId) where.driver = { user: { companyId } }
    const responses = await this.prisma.response.findMany({
      where,
      orderBy: { fecha: 'desc' },
      take: 500,
      include: RESPONSE_INCLUDE,
    })
    return responses.map(r => this.serializeResponse(r))
  }

  /**
   * findByRange — todas las respuestas en un rango de fechas Colombia.
   * Sin límite de 500. Usado exclusivamente para el reporte de cumplimiento.
   * Rango max recomendado: 31 días (mes).
   */
  async findByRange(desde: string, hasta: string, companyId?: number) {
    // Validar formato YYYY-MM-DD
    const isoRe = /^\d{4}-\d{2}-\d{2}$/
    if (!isoRe.test(desde) || !isoRe.test(hasta)) {
      throw new BadRequestException('Las fechas deben tener formato YYYY-MM-DD')
    }

    // Rango UTC que cubre ambos días en Colombia (UTC-5)
    const [dy, dm, dd] = desde.split('-').map(Number)
    const [hy, hm, hd] = hasta.split('-').map(Number)
    const gte = new Date(Date.UTC(dy, dm - 1, dd,     5, 0, 0, 0))
    const lt  = new Date(Date.UTC(hy, hm - 1, hd + 1, 5, 0, 0, 0))

    const where: any = { fecha: { gte, lt } }
    if (companyId) where.driver = { user: { companyId } }

    const responses = await this.prisma.response.findMany({
      where,
      orderBy: { fecha: 'asc' },
      include: RESPONSE_INCLUDE,
    })
    return responses.map(r => this.serializeResponse(r))
  }

  async findToday(companyId?: number) {
    const where: any = { fecha: this.getDayRange() }
    if (companyId) where.driver = { user: { companyId } }
    const responses = await this.prisma.response.findMany({
      where,
      orderBy: { fecha: 'desc' },
      include: RESPONSE_INCLUDE,
    })
    return responses.map(r => this.serializeResponse(r))
  }

  async findByUser(userId: number, caller?: CurrentUserData) {
    const driver = await this.prisma.driver.findUnique({
      where:  { userId },
      select: { id: true, user: { select: { companyId: true } } },
    })
    if (!driver) return []

    // SEGURIDAD multi-tenant: un ADMIN solo puede leer historiales de su empresa
    if (caller) assertSameCompany(caller, driver.user.companyId)

    const responses = await this.prisma.response.findMany({
      where:   { driverId: driver.id },
      orderBy: { fecha: 'desc' },
      include: RESPONSE_INCLUDE,
    })
    return responses.map(r => this.serializeResponse(r))
  }

  async findOne(id: number, caller?: CurrentUserData) {
    const owner = await this.prisma.response.findUnique({
      where:   { id },
      select:  { driver: { select: { user: { select: { companyId: true } } } } },
    })
    if (!owner) throw new NotFoundException(`Respuesta #${id} no encontrada`)

    // SEGURIDAD multi-tenant: un ADMIN solo puede leer inspecciones de su empresa
    if (caller) assertSameCompany(caller, owner.driver.user.companyId)

    const response = await this.prisma.response.findUnique({
      where:   { id },
      include: RESPONSE_INCLUDE,
    })
    if (!response) throw new NotFoundException(`Respuesta #${id} no encontrada`)
    return this.serializeResponse(response)
  }
}