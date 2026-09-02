import { Controller, Get } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Controller('health')
export class HealthController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async check() {
    const checks: Record<string, any> = {
      status: 'ok',
      timestamp: new Date().toISOString(),
    }

    try {
      await this.prisma.$queryRaw`SELECT 1`
      checks['database'] = 'connected'
    } catch {
      checks['database'] = 'disconnected'
      checks['status'] = 'degraded'
    }

    return checks
  }
}
