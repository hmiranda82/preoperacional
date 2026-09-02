import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'
import * as crypto from 'crypto'
import { PrismaService } from '../prisma/prisma.service'
import { UsersService } from '../users/users.service'
import { AuditService } from '../audit/audit.service'

const ACCESS_TOKEN_EXPIRY = '1h'
const REFRESH_TOKEN_EXPIRY_DAYS = 7

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
    private jwtService: JwtService,
    private audit: AuditService,
  ) {}

  private generateRefreshToken(): string {
    return crypto.randomBytes(48).toString('hex')
  }

  private async createSession(userId: number): Promise<string> {
    const refreshToken = this.generateRefreshToken()
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000)
    await this.prisma.session.create({
      data: { userId, refreshToken, expiresAt },
    })
    return refreshToken
  }

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmail(email)
    if (!user) {
      await this.audit.log({ action: 'LOGIN_FAILED', entity: 'User', entityId: undefined })
      throw new UnauthorizedException('Credenciales incorrectas')
    }

    if (user.role === 'SUPER_ROOT') {
      await this.audit.log({ action: 'LOGIN_BLOCKED_SUPER', entity: 'User', entityId: user.id })
      throw new UnauthorizedException('Credenciales incorrectas')
    }

    const valid = await bcrypt.compare(password, user.password)
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
      user: this.usersService.serializeUser(user),
    }
  }

  async refreshToken(refreshToken: string) {
    const session = await this.prisma.session.findUnique({
      where: { refreshToken },
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

    await this.prisma.session.delete({ where: { id: session.id } })

    const payload = { sub: user.id, email: user.email, role: user.role, companyId: user.companyId }
    const access_token = this.jwtService.sign(payload, { expiresIn: ACCESS_TOKEN_EXPIRY })
    const new_refresh_token = await this.createSession(user.id)

    return {
      access_token,
      refresh_token: new_refresh_token,
      user: this.usersService.serializeUser(user),
    }
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
