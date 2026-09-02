import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'
import * as crypto from 'crypto'
import { PrismaService } from '../prisma/prisma.service'
import { UsersService } from '../users/users.service'
import { AuditService } from '../audit/audit.service'
import {
  passwordPolicyErrors,
  passwordPolicyContextErrors,
  RESET_TOKEN_HEX_LENGTH,
  RESET_TOKEN_TTL_MINUTES,
} from '../common/password-policy'

const ACCESS_TOKEN_EXPIRY = '1h'
const REFRESH_TOKEN_EXPIRY_DAYS = 7

/**
 * Se almacenan únicamente hashes SHA-256 de los refresh tokens y de los tokens de
 * restablecimiento; nunca el valor plano. Un leak de la tabla sessions/password_resets
 * no permite reutilizar tokens, pero al conservar el hash sí permite revocarlos/validarlos.
 */
function sha256(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex')
}

// Dummy hash para igualar el tiempo de respuesta en /auth/login cuando el email
// no existe (evalúa bcrypt contra un hash de costo 12 aunque no haya usuario).
const DUMMY_LOGIN_HASH = '$2b$12$C6UzMDM.H6dF3tKpRzF1OeZ1J2Lk5Q1mh0K8mZvU0Y1tZJhCz1GPa'

// Por defecto todo el mundo puede cambiar su propia contraseña (a la vez que debe
// pertenecer a un rol del sistema). Evitamos que un SUPER_ROOT cambie contraseñas
// de cuentas SUPER_ROOT por un flujo no supervisado. El panel exigirá mucha menos
// frecuencia. No hay restricción adicional a nivel de rol para el self-service.
@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
    private jwtService: JwtService,
    private audit: AuditService,
  ) {}

  private static hashToken(value: string): string {
    return sha256(value)
  }

  private generateRefreshToken(): string {
    return crypto.randomBytes(48).toString('hex')
  }

  private async createSession(userId: number): Promise<string> {
    const refreshToken = this.generateRefreshToken()
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000)
    await this.prisma.session.create({
      data: { userId, refreshToken: AuthService.hashToken(refreshToken), expiresAt },
    })
    return refreshToken
  }

  /**
   * Revoca todas las sesiones (refresh tokens) de un usuario salvo las creadas
   * a partir de una fecha. Se usa en cambio de contraseña y reset para invalidar
   * sesiones anteriores a la rotación.
   */
  private async revokeSessionsBefore(userId: number, before: Date): Promise<void> {
    await this.prisma.session.deleteMany({
      where: { userId, createdAt: { lte: before } },
    })
  }

  private async findFullUserByEmail(email: string) {
    return this.usersService.findByEmailForAuth(email)
  }

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmailForAuth(email)

    // Anti-enumeración por timing: si no existe el usuario, aun así ejecutamos
    // un bcrypt.compare contra un hash dummy para que la latencia sea uniforme.
    if (!user) {
      await bcrypt.compare(password, DUMMY_LOGIN_HASH)
      await this.audit.log({ action: 'LOGIN_FAILED', entity: 'User', entityId: undefined })
      throw new UnauthorizedException('Credenciales incorrectas')
    }

    if (user.role === 'SUPER_ROOT') {
      await bcrypt.compare(password, DUMMY_LOGIN_HASH)
      await this.audit.log({ action: 'LOGIN_BLOCKED_SUPER', entity: 'User', entityId: user.id })
      throw new UnauthorizedException('Credenciales incorrectas')
    }

    const valid = await bcrypt.compare(password, user.password)

    // Aun cuando el hash no coincida, igualamos el costo con un dummy para
    // ocultar si el email existía (ya cubierto arriba, aquí es para el caso SUPER).
    if (!valid) {
      await this.audit.log({ action: 'LOGIN_FAILED', entity: 'User', entityId: user.id })
      throw new UnauthorizedException('Credenciales incorrectas')
    }

    if (!user.isActive) {
      await this.audit.log({ action: 'LOGIN_BLOCKED', entity: 'User', entityId: user.id, userId: user.id })
      throw new UnauthorizedException('Usuario inactivo')
    }

    const payload = { sub: user.id, email: user.email, role: user.role, companyId: user.companyId }
    const access_token = this.jwtService.sign(payload, { expiresIn: ACCESS_TOKEN_EXPIRY })
    const refresh_token = await this.createSession(user.id)

    await this.audit.log({
      userId: user.id,
      action: 'LOGIN_SUCCESS',
      entity: 'User',
      entityId: user.id,
    })

    return {
      access_token,
      refresh_token,
      mustChangePassword: user.mustChangePassword ?? false,
      user: this.usersService.serializeUser(user),
    }
  }

  async superLogin(email: string, password: string) {
    const user = await this.usersService.findByEmail(email)
    if (!user || user.role !== 'SUPER_ROOT') {
      await this.audit.log({ action: 'SUPER_LOGIN_FAILED', entity: 'User', entityId: undefined })
      throw new UnauthorizedException('Credenciales inválidas')
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      await this.audit.log({ action: 'SUPER_LOGIN_FAILED', entity: 'User', entityId: user.id })
      throw new UnauthorizedException('Credenciales inválidas')
    }

    if (!user.isActive) {
      await this.audit.log({ action: 'SUPER_LOGIN_BLOCKED', entity: 'User', entityId: user.id })
      throw new UnauthorizedException('Usuario inactivo')
    }

    const payload = { sub: user.id, email: user.email, role: user.role, companyId: user.companyId }
    const access_token = this.jwtService.sign(payload, { expiresIn: ACCESS_TOKEN_EXPIRY })
    const refresh_token = await this.createSession(user.id)

    await this.audit.log({
      userId: user.id,
      action: 'SUPER_LOGIN_SUCCESS',
      entity: 'User',
      entityId: user.id,
    })

    return {
      access_token,
      refresh_token,
      mustChangePassword: user.mustChangePassword ?? false,
      user: this.usersService.serializeUser(user),
    }
  }

  async refreshToken(refreshToken: string) {
    const tokenHash = AuthService.hashToken(refreshToken)
    const session = await this.prisma.session.findUnique({
      where: { refreshToken: tokenHash },
      include: { user: true },
    })

    if (!session) {
      throw new UnauthorizedException('Refresh token inválido')
    }

    if (session.expiresAt < new Date()) {
      await this.prisma.session.delete({ where: { id: session.id } })
      throw new UnauthorizedException('Refresh token expirado')
    }

    const user = session.user
    if (!user.isActive) {
      await this.prisma.session.delete({ where: { id: session.id } })
      throw new UnauthorizedException('Usuario inactivo')
    }

    // Si la contraseña cambió/reseteó después de emitirse esta sesión, se revoca.
    if (user.passwordChangedAt && session.createdAt < user.passwordChangedAt) {
      await this.prisma.session.delete({ where: { id: session.id } })
      throw new UnauthorizedException('Tu sesión fue cerrada por cambio de contraseña')
    }

    await this.prisma.session.delete({ where: { id: session.id } })

    const payload = { sub: user.id, email: user.email, role: user.role, companyId: user.companyId }
    const access_token = this.jwtService.sign(payload, { expiresIn: ACCESS_TOKEN_EXPIRY })
    const new_refresh_token = await this.createSession(user.id)

    return {
      access_token,
      refresh_token: new_refresh_token,
      mustChangePassword: user.mustChangePassword ?? false,
      user: this.usersService.serializeUser(user),
    }
  }

  /**
   * POST /auth/change-password
   * Permite a un admin o conductor cambiar su propia contraseña (autenticado).
   * Requiere la contraseña actual, valida la política, y revoca las sesiones previas.
   */
  async changePassword(userId: number, currentPassword: string, newPassword: string) {
    const user = await this.usersService.findRawById(userId)
    if (!user) {
      throw new UnauthorizedException('Credenciales incorrectas')
    }

    const valid = await bcrypt.compare(currentPassword, user.password)
    if (!valid) {
      await this.audit.log({ action: 'PASSWORD_CHANGE_FAILED', entity: 'User', entityId: user.id, userId: user.id })
      throw new BadRequestException('La contraseña actual es incorrecta')
    }

    const same = await bcrypt.compare(newPassword, user.password)
    if (same) {
      throw new BadRequestException('La nueva contraseña debe ser diferente a la actual')
    }

    await this.applyNewPassword(user, newPassword, 'CHANGE')
    return { message: 'Contraseña actualizada correctamente' }
  }

  /**
   * POST /auth/reset-password
   * Consume un token de restablecimiento de uso único (generado por un admin o creado
   * manualmente) y fija la nueva contraseña, revocando toda sesión previa.
   */
  async resetPassword(token: string, newPassword: string) {
    const tokenHash = AuthService.hashToken(token)
    const record = await this.prisma.passwordReset.findUnique({
      where: { tokenHash },
      include: { user: true },
    })

    if (!record || record.usedAt) {
      const generic = new BadRequestException('El enlace de restablecimiento es inválido o ya fue utilizado')
      await bcrypt.compare(newPassword, DUMMY_LOGIN_HASH)
      throw generic
    }

    if (record.expiresAt < new Date()) {
      await this.prisma.passwordReset.delete({ where: { id: record.id } })
      throw new BadRequestException('El enlace de restablecimiento ha expirado')
    }

    if (!record.user.isActive) {
      throw new BadRequestException('La cuenta está inactiva')
    }

    await this.prisma.passwordReset.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    })

    await this.applyNewPassword(record.user, newPassword, 'RESET')
    await this.audit.log({
      userId: record.user.id,
      action: 'PASSWORD_RESET_USED',
      entity: 'User',
      entityId: record.user.id,
    })

    return { message: 'Contraseña restablecida correctamente. Ya puedes iniciar sesión.' }
  }

  /**
   * Aplica una nueva contraseña validando la política de seguridad, la guarda con
   * bcrypt (cost 12), registra el timestamp y revoca las sesiones previas.
   */
  private async applyNewPassword(
    user: { id: number; email: string; cedula?: string | null; password: string },
    newPassword: string,
    action: 'CHANGE' | 'RESET',
  ) {
    const policy = passwordPolicyErrors(newPassword) ?? passwordPolicyContextErrors(newPassword, {
      email: user.email,
      cedula: user.cedula as any,
    })
    if (policy) {
      throw new BadRequestException(policy)
    }

    const passwordChangedAt = new Date()
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    await this.prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword, passwordChangedAt, mustChangePassword: false },
    })

    await this.revokeSessionsBefore(user.id, passwordChangedAt)

    await this.audit.log({
      userId: user.id,
      action: action === 'CHANGE' ? 'PASSWORD_CHANGED' : 'PASSWORD_RESET',
      entity: 'User',
      entityId: user.id,
    })
  }

  /**
   * Genera un token de restablecimiento de uso único. Devuelve el token plano (única
   * vez, para que el solicitante lo entregue); en BD se guarda solo su hash.
   * Al consumirlo se marcará mustChangePassword = true.
   */
  async generatePasswordResetToken(userId: number, createdBy: { id: number; role: string }) {
    const target = await this.usersService.findRawById(userId)
    if (!target) {
      throw new BadRequestException('Usuario no encontrado')
    }

    // Solo SUPER_ROOT puede generar tokens para cuentas SUPER_ROOT
    if (target.role === 'SUPER_ROOT' && createdBy.role !== 'SUPER_ROOT') {
      throw new ForbiddenException('No tienes permisos para restablecer esta cuenta')
    }

    await this.prisma.passwordReset.deleteMany({
      where: { userId, usedAt: null },
    })

    const token = crypto.randomBytes(RESET_TOKEN_HEX_LENGTH / 2).toString('hex')
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000)

    await this.prisma.passwordReset.create({
      data: {
        userId,
        tokenHash: AuthService.hashToken(token),
        motivo: 'ADMIN',
        createdBy: createdBy.id,
        expiresAt,
      },
    })

    await this.prisma.user.update({
      where: { id: userId },
      data: { mustChangePassword: true },
    })

    await this.audit.log({
      userId: createdBy.id,
      action: 'PASSWORD_RESET_TOKEN_GENERATED',
      entity: 'User',
      entityId: userId,
    })

    return { token, expiresAt, role: target.role === 'DRIVER' ? 'CONDUCTOR' : target.role }
  }

  async logoutAllSessions(userId: number) {
    await this.prisma.session.deleteMany({ where: { userId } })
    await this.audit.log({
      userId,
      action: 'LOGOUT_ALL',
      entity: 'User',
      entityId: userId,
    })
    return { message: 'Sesiones cerradas exitosamente' }
  }
}
