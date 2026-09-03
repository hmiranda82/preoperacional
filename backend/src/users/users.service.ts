import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import * as bcrypt from 'bcrypt'
import { PrismaService } from '../prisma/prisma.service'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import type { CurrentUserData } from '../common/decorators/current-user.decorator'
import { assertSameCompany } from '../common/tenant.util'
import {
  passwordPolicyErrors,
  passwordPolicyContextErrors,
} from '../common/password-policy'

const USER_INCLUDE = {
  admin: true,
  driver: true,
} as const

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  private todayCol(): string {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date())
  }

  private async attachVacationStatus(users: any[]): Promise<any[]> {
    const driverIds = users.filter(u => u.driver).map(u => u.driver.id)
    if (!driverIds.length) return users

    const today = this.todayCol()
    const [vacDays, ausencias] = await Promise.all([
      this.prisma.vacationDay.findMany({
        where: {
          driverId: { in: driverIds },
          activo: true,
          vacation: { activo: true },
          fecha: new Date(today),
        },
        select: { driverId: true, vacationId: true },
      }),
      this.prisma.ausencia.findMany({
        where: {
          driverId: { in: driverIds },
          activo: true,
          fecha: new Date(today),
        },
        select: { driverId: true, fecha: true, motivo: true },
      }),
    ])
    const vacationSet = new Set(vacDays.map(v => v.driverId))
    const ausenciaMap = new Map(ausencias.map(a => [a.driverId, a]))

    return users.map(u => {
      if (u.driver) {
        u.enVacaciones = vacationSet.has(u.driver.id)
        u.vacacion = u.enVacaciones ? { fechaInicio: today, fechaFin: today } : null
        const a = ausenciaMap.get(u.driver.id)
        u.enAusencia = !!a
        u.ausencia = a ? { fecha: a.fecha, motivo: a.motivo } : null
      } else {
        u.enVacaciones = false
        u.vacacion = null
        u.enAusencia = false
        u.ausencia = null
      }
      return u
    })
  }

  serializeUser(user: any) {
    const driver = user?.driver ?? null
    const admin = user?.admin ?? null
    const profile = driver ?? admin

    return {
      id: user.id,
      companyId: user.companyId,
      email: user.email,
      role: user.role,
      // FIX #1: map 'DRIVER' → 'CONDUCTOR' so frontend can filter by rol === 'CONDUCTOR'
      rol: user.role === 'DRIVER' ? 'CONDUCTOR' : user.role === 'SUPER_ROOT' ? 'SUPER_ROOT' : user.role,
      isActive: user.isActive,
      activo: user.isActive,
      mustChangePassword: user.mustChangePassword ?? false,
      passwordChangedAt: user.passwordChangedAt ?? null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt ?? null,
      cedula: profile?.cedula ?? (user.role === 'SUPER_ROOT' ? '0000000000' : null),
      nombre: profile?.nombre ?? (user.role === 'SUPER_ROOT' ? 'Super Root' : null),
      telefono: driver?.telefono ?? admin?.telefono ?? null,
      placa: driver?.placa ?? null,
      ciudad: driver?.ciudad ?? admin?.ciudad ?? null,
      soatVigencia: driver?.soatVigencia ?? null,
      tecniVigencia: driver?.tecniVigencia ?? null,
      estado: driver?.estado ?? null,
      permisos: admin?.permisos ?? null,
      enVacaciones: user.enVacaciones ?? false,
      vacacion: user.vacacion ?? null,
      enAusencia: user.enAusencia ?? false,
      ausencia: user.ausencia ?? null,
      admin: admin
        ? {
            id: admin.id,
            cedula: admin.cedula,
            nombre: admin.nombre,
            telefono: admin.telefono ?? null,
            ciudad: admin.ciudad ?? null,
            permisos: admin.permisos ?? null,
          }
        : null,
      driver: driver
        ? {
            id: driver.id,
            cedula: driver.cedula,
            nombre: driver.nombre,
            telefono: driver.telefono ?? null,
            placa: driver.placa ?? null,
            ciudad: driver.ciudad ?? null,
            soatVigencia: driver.soatVigencia ?? null,
            tecniVigencia: driver.tecniVigencia ?? null,
            estado: driver.estado,
            diasLaborales: driver.diasLaborales ?? '1,2,3,4,5',
          }
        : null,
    }
  }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: USER_INCLUDE,
    })
  }

  /** Devuelve el usuario completo (incl. password, flags) para autenticación. */
  findByEmailForAuth(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: USER_INCLUDE,
    })
  }

  /** Devuelve el User "crudo" (sin incluir driver/admin) para flujos de credenciales. */
  findRawById(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        driver: { select: { cedula: true } },
        admin: { select: { cedula: true } },
      },
    })
  }

  async findById(id: number, companyId?: number) {
    const where: any = { id }
    if (companyId) where.companyId = companyId
    const user = await this.prisma.user.findFirst({
      where,
      include: USER_INCLUDE,
    })
    if (!user) throw new NotFoundException(`Usuario #${id} no encontrado`)
    const withVac = await this.attachVacationStatus([user])
    return this.serializeUser(withVac[0])
  }

  async findAll(companyId?: number) {
    const where: any = { role: { not: 'SUPER_ROOT' } }
    if (companyId) where.companyId = companyId
    const users = await this.prisma.user.findMany({
      where,
      include: USER_INCLUDE,
      orderBy: { createdAt: 'desc' },
    })
    const withVacations = await this.attachVacationStatus(users)
    return withVacations.map((user) => this.serializeUser(user))
  }

  private async ensureEmailAvailable(email: string, excludeUserId?: number) {
    const existing = await this.prisma.user.findFirst({
      where: {
        email,
        ...(excludeUserId ? { NOT: { id: excludeUserId } } : {}),
      },
    })
    if (existing) {
      throw new ConflictException('Ya existe un usuario con ese correo electrónico')
    }
  }

  private async ensureCedulaAvailable(cedula: string, excludeUserId?: number) {
    const [driver, admin] = await Promise.all([
      this.prisma.driver.findFirst({
        where: {
          cedula,
          ...(excludeUserId ? { NOT: { userId: excludeUserId } } : {}),
        },
      }),
      this.prisma.admin.findFirst({
        where: {
          cedula,
          ...(excludeUserId ? { NOT: { userId: excludeUserId } } : {}),
        },
      }),
    ])
    if (driver || admin) {
      throw new ConflictException('Ya existe un usuario con esa cédula')
    }
  }

  private buildDriverData(dto: CreateUserDto | UpdateUserDto, currentDriver?: any) {
    return {
      cedula: dto.cedula ?? currentDriver?.cedula,
      nombre: dto.nombre ?? currentDriver?.nombre,
      telefono:
        dto.telefono !== undefined ? dto.telefono : (currentDriver?.telefono ?? undefined),
      placa: dto.placa !== undefined ? dto.placa : (currentDriver?.placa ?? undefined),
      ciudad: dto.ciudad !== undefined ? dto.ciudad : (currentDriver?.ciudad ?? undefined),
      soatVigencia:
        dto.soatVigencia !== undefined
          ? (dto.soatVigencia ? new Date(dto.soatVigencia) : null)
          : (currentDriver?.soatVigencia ?? undefined),
      tecniVigencia:
        dto.tecniVigencia !== undefined
          ? (dto.tecniVigencia ? new Date(dto.tecniVigencia) : null)
          : (currentDriver?.tecniVigencia ?? undefined),
      estado: dto.estado ?? currentDriver?.estado ?? 'ACTIVO',
      diasLaborales:
        dto.diasLaborales !== undefined
          ? dto.diasLaborales
          : (currentDriver?.diasLaborales ?? '1,2,3,4,5'),
    }
  }

  private buildAdminData(dto: CreateUserDto | UpdateUserDto, currentAdmin?: any) {
    return {
      cedula: dto.cedula ?? currentAdmin?.cedula,
      nombre: dto.nombre ?? currentAdmin?.nombre,
      telefono:
        dto.telefono !== undefined ? dto.telefono : (currentAdmin?.telefono ?? undefined),
      ciudad:
        dto.ciudad !== undefined ? dto.ciudad : (currentAdmin?.ciudad ?? undefined),
      permisos: dto.permisos ?? currentAdmin?.permisos ?? null,
    }
  }

  async create(dto: CreateUserDto, companyId: number) {
    const role = dto.role === 'CONDUCTOR' ? 'DRIVER' : (dto.role ?? 'DRIVER')

    await this.ensureEmailAvailable(dto.email)
    await this.ensureCedulaAvailable(dto.cedula)

    // Política de contraseña unificada (8..72, sin banlist/secuencias/datos personales)
    const policy = passwordPolicyErrors(dto.password) ?? passwordPolicyContextErrors(dto.password, {
      email: dto.email,
      cedula: dto.cedula,
    })
    if (policy) {
      throw new BadRequestException(policy)
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12)

    const user = await this.prisma.user.create({
      data: {
        companyId,
        email: dto.email,
        password: hashedPassword,
        role,
        isActive: dto.isActive ?? true,
        passwordChangedAt: new Date(),
        mustChangePassword: false,
        admin:
          role === 'ADMIN'
            ? { create: this.buildAdminData(dto) }
            : undefined,
        driver:
          role === 'DRIVER'
            ? { create: this.buildDriverData(dto) }
            : undefined,
      },
      include: USER_INCLUDE,
    })

    return this.serializeUser(user)
  }

  async update(id: number, dto: UpdateUserDto, caller?: CurrentUserData) {
    const callerRole      = caller?.role ?? 'SUPER_ROOT'
    const callerCompanyId = caller?.companyId

    const currentUser = await this.prisma.user.findFirst({
      where: {
        id,
        ...(callerRole === 'SUPER_ROOT' ? {} : { companyId: callerCompanyId }),
      },
      include: USER_INCLUDE,
    })

    if (!currentUser) {
      throw new NotFoundException(`Usuario #${id} no encontrado`)
    }

    // Solo SUPER_ROOT puede modificar cuentas SUPER_ROOT
    if (currentUser.role === 'SUPER_ROOT' && callerRole !== 'SUPER_ROOT') {
      throw new ForbiddenException('No tienes permisos para modificar cuentas SUPER_ROOT')
    }

    if (dto.email && dto.email !== currentUser.email) {
      await this.ensureEmailAvailable(dto.email, id)
    }

    const nextRole = dto.role === 'CONDUCTOR' ? 'DRIVER' : (dto.role ?? currentUser.role)
    const currentProfile = currentUser.driver ?? currentUser.admin
    const nextCedula = dto.cedula ?? currentProfile?.cedula
    const nextNombre = dto.nombre ?? currentProfile?.nombre

    if (!nextCedula || !nextNombre) {
      throw new BadRequestException(
        'No fue posible determinar la cédula y el nombre del perfil a actualizar',
      )
    }

    if (nextCedula !== currentProfile?.cedula || nextRole !== currentUser.role) {
      await this.ensureCedulaAvailable(nextCedula, id)
    }

    let hashedPassword: string | undefined
    if (dto.password) {
      const policy = passwordPolicyErrors(dto.password) ?? passwordPolicyContextErrors(dto.password, {
        email: dto.email ?? currentUser.email,
        cedula: nextCedula,
      })
      if (policy) {
        throw new BadRequestException(policy)
      }
      hashedPassword = await bcrypt.hash(dto.password, 12)
    }

    const data: any = {
      ...(dto.email !== undefined ? { email: dto.email } : {}),
      ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      ...(nextRole !== currentUser.role ? { role: nextRole } : {}),
      ...(hashedPassword ? { password: hashedPassword } : {}),
    }

    // Si un admin/SUPER_ROOT reasigna una contraseña, se exige el cambio en el
    // primer inicio de sesión y se invalidan las sesiones previas del usuario.
    let mustDeleteSessions = false
    if (hashedPassword) {
      data.passwordChangedAt = new Date()
      data.mustChangePassword = caller?.id === id ? false : true
      mustDeleteSessions = true
    }

    if (nextRole === 'SUPER_ROOT') {
      // SUPER_ROOT no tiene perfil (ni admin ni driver)
      if (currentUser.admin) data.admin = { delete: true }
      if (currentUser.driver) data.driver = { delete: true }
    } else if (nextRole === 'DRIVER') {
      const driverData = this.buildDriverData(
        { ...dto, cedula: nextCedula, nombre: nextNombre, role: nextRole },
        currentUser.driver,
      )
      data.driver = currentUser.driver
        ? { update: driverData }
        : { create: driverData }
      if (currentUser.admin) {
        data.admin = { delete: true }
      }
    } else {
      const adminData = this.buildAdminData(
        { ...dto, cedula: nextCedula, nombre: nextNombre, role: nextRole },
        currentUser.admin,
      )
      data.admin = currentUser.admin
        ? { update: adminData }
        : { create: adminData }
      if (currentUser.driver) {
        data.driver = { delete: true }
      }
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data,
      include: USER_INCLUDE,
    })

    // Invalida todas las sesiones del usuario cuyo password cambió (el caller
    // conserva la suya porque su access token sigue vigente; al expirar deberá
    // reautenticarse con la nueva contraseña).
    if (mustDeleteSessions) {
      await this.prisma.session.deleteMany({ where: { userId: id } })
    }

    return this.serializeUser(updated)
  }

  async remove(id: number, caller: CurrentUserData) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        ...USER_INCLUDE,
        driver: {
          include: {
            _count: { select: { responses: true } },
          },
        },
      },
    })

    if (!user) throw new NotFoundException(`Usuario #${id} no encontrado`)

    // SEGURIDAD multi-tenant: un ADMIN solo puede eliminar cuentas de su empresa
    assertSameCompany(caller, user.companyId)
    // Solo SUPER_ROOT puede eliminar cuentas SUPER_ROOT
    if (user.role === 'SUPER_ROOT' && caller.role !== 'SUPER_ROOT') {
      throw new ForbiddenException('No tienes permisos para eliminar cuentas SUPER_ROOT')
    }

    const serialized = this.serializeUser(user)
    const responseCount = (user.driver as any)?._count?.responses ?? 0

    if (responseCount > 0) {
      await this.prisma.user.update({
        where: { id },
        data: { isActive: false },
      })
      return {
        id,
        nombre: serialized.nombre,
        email: serialized.email,
        _action: 'deactivated',
        _cascaded: { responses: responseCount },
      }
    }

    await this.prisma.user.delete({ where: { id } })

    return {
      id,
      nombre: serialized.nombre,
      email: serialized.email,
      _action: 'deleted',
      _cascaded: { responses: responseCount },
    }
  }
}