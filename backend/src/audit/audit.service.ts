import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(params: {
    userId?: number
    action: string
    entity: string
    entityId?: number
  }): Promise<void> {
    try {
      // Obtener companyId del usuario si está disponible
      let companyId: number | undefined
      if (params.userId) {
        const user = await this.prisma.user.findUnique({
          where: { id: params.userId },
          select: { companyId: true },
        })
        if (user) companyId = user.companyId
      }
      await this.prisma.auditLog.create({
        data: {
          companyId: companyId ?? 1,
          userId: params.userId ?? null,
          action: params.action,
          entity: params.entity,
          entityId: params.entityId ?? null,
        },
      })
    } catch {
      // Audit failures should never break the main flow
      console.error('Failed to write audit log:', params)
    }
  }
}
