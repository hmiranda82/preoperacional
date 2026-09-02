import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId?: number, companyId?: number) {
    const auditWhere: any = {}
    const dailyWhere: any = {}
    const respWhere: any = {}
    if (companyId) {
      auditWhere.companyId = companyId
      dailyWhere.driver = { user: { companyId } }
      respWhere.driver = { user: { companyId } }
    }
    const [auditLogs, dailyStatus, recentResponses] = await Promise.all([
      this.prisma.auditLog.findMany({
        where: auditWhere,
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      this.prisma.dailyStatus.findMany({
        where: dailyWhere,
        orderBy: { updatedAt: 'desc' },
        take: 20,
        include: {
          driver: { select: { nombre: true, placa: true } },
        },
      }),
      this.prisma.response.findMany({
        where: respWhere,
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          driver: { select: { nombre: true, placa: true } },
        },
      }),
    ])

    const notifications: {
      id: string
      text: string
      time: string
      read: boolean
      icon: string
      createdAt: Date
    }[] = []

    for (const log of auditLogs) {
      if (log.action === 'LOGIN_SUCCESS') {
        notifications.push({
          id: `audit-${log.id}`,
          text: `Inicio de sesión${log.userId ? ' (usuario #' + log.userId + ')' : ''}`,
          time: this.formatTime(log.createdAt),
          read: false,
          icon: 'user',
          createdAt: log.createdAt,
        })
      } else if (log.action === 'LOGIN_FAILED') {
        notifications.push({
          id: `audit-${log.id + 1000}`,
          text: `Intento de inicio de sesión fallido${log.userId ? ' (usuario #' + log.userId + ')' : ''}`,
          time: this.formatTime(log.createdAt),
          read: false,
          icon: 'alert',
          createdAt: log.createdAt,
        })
      }
    }

    for (const ds of dailyStatus) {
      const driverName = ds.driver?.nombre ?? 'Conductor'
      const placa = ds.driver?.placa ?? ''

      if (ds.estado === 'COMPLETADO') {
        notifications.push({
          id: `daily-${ds.id}`,
          text: `${driverName} completó la revisión preoperacional${placa ? ' (' + placa + ')' : ''}`,
          time: this.formatTime(ds.updatedAt ?? ds.createdAt),
          read: false,
          icon: 'ok',
          createdAt: ds.updatedAt ?? ds.createdAt,
        })
      } else if (ds.estado === 'INCUMPLIDO') {
        notifications.push({
          id: `daily-${ds.id + 1000}`,
          text: `${driverName} incumplió la revisión del día${placa ? ' (' + placa + ')' : ''}`,
          time: this.formatTime(ds.updatedAt ?? ds.createdAt),
          read: false,
          icon: 'alert',
          createdAt: ds.updatedAt ?? ds.createdAt,
        })
      }
    }

    for (const r of recentResponses) {
      const driverName = r.driver?.nombre ?? 'Conductor'
      const placa = r.driver?.placa ?? ''
      notifications.push({
        id: `resp-${r.id}`,
        text: `Nueva inspección registrada por ${driverName}${placa ? ' (' + placa + ')' : ''}`,
        time: this.formatTime(r.createdAt),
        read: false,
        icon: 'doc',
        createdAt: r.createdAt,
      })
    }

    notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

    const sliced = notifications.slice(0, 30)

    if (userId) {
      const userReads = await this.prisma.notificationRead.findMany({
        where: { userId },
        select: { notificationId: true },
      })
      const readIds = new Set(userReads.map(r => r.notificationId))
      for (const n of sliced) {
        if (readIds.has(n.id)) {
          n.read = true
        }
      }
    }

    return sliced
  }

  async markAsRead(userId: number, notificationId: string) {
    await this.prisma.notificationRead.upsert({
      where: {
        userId_notificationId: { userId, notificationId },
      },
      create: { userId, notificationId },
      update: {},
    })
    return { success: true }
  }

  private formatTime(date: Date): string {
    const diff = Date.now() - date.getTime()
    const mins = Math.floor(diff / 60000)
    const hrs = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (mins < 1) return 'Ahora'
    if (mins < 60) return `hace ${mins} min`
    if (hrs < 24) return `hace ${hrs} h`
    return `hace ${days} d`
  }
}
