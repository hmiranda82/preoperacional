import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { PrismaService } from '../prisma/prisma.service'

/**
 * Tareas de mantenimiento periódico.
 *
 * Purga registros expirados que antes solo se eliminaban "perezosamente"
 * al intentar usarlos: sesiones (refresh tokens) y tokens de reset de
 * contraseña. Sin esto, sessions y password_resets crecen indefinidamente.
 *
 * 03:30 UTC = 22:30 Colombia (hora valle), lejos del cierre del día
 * (04:59 UTC) para no competir por la BD.
 */
@Injectable()
export class MaintenanceService {
  private readonly logger = new Logger(MaintenanceService.name)

  constructor(private prisma: PrismaService) {}

  @Cron('30 3 * * *', { timeZone: 'UTC' })
  async purgeExpired(): Promise<void> {
    try {
      const [sessions, resets] = await Promise.all([
        this.prisma.session.deleteMany({ where: { expiresAt: { lt: new Date() } } }),
        this.prisma.passwordReset.deleteMany({ where: { expiresAt: { lt: new Date() } } }),
      ])
      if (sessions.count > 0 || resets.count > 0) {
        this.logger.log(`Purga de expirados: ${sessions.count} sesiones, ${resets.count} tokens de reset`)
      }
    } catch (err) {
      this.logger.error(
        'Falló la purga de registros expirados',
        err instanceof Error ? err.stack : String(err),
      )
    }
  }
}
