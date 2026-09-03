import {
  Controller, Get, Post, Param,
  Query, UseGuards, ParseIntPipe,
} from '@nestjs/common'
import { ComplianceService } from './compliance.service'
import { JwtAuthGuard }      from '../common/guards/jwt-auth.guard'
import { RolesGuard }        from '../common/guards/roles.guard'
import { Roles }             from '../common/decorators/roles.decorator'
import { CurrentUser }       from '../common/decorators/current-user.decorator'
import type { CurrentUserData } from '../common/decorators/current-user.decorator'

@Controller('compliance')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class ComplianceController {
  constructor(private readonly service: ComplianceService) {}

  /** Estado del día de hoy — para el dashboard */
  @Get('today')
  today(@CurrentUser() user: CurrentUserData) {
    const cid = user.role === 'SUPER_ROOT' ? undefined : user.companyId
    return this.service.getTodayStatus(cid)
  }

  /** Historial de los últimos N días */
  @Get('history')
  history(@Query('days') days?: string, @CurrentUser() user?: CurrentUserData) {
    const cid = user?.role === 'SUPER_ROOT' ? undefined : user?.companyId
    return this.service.getHistory(days ? Number(days) : 14, cid)
  }

  /** Conductores incumplidos hoy o en fecha dada (YYYY-MM-DD) */
  @Get('incumplidos')
  incumplidos(@Query('fecha') fecha?: string, @CurrentUser() user?: CurrentUserData) {
    const cid = user?.role === 'SUPER_ROOT' ? undefined : user?.companyId
    return this.service.getIncumplidos(fecha, cid)
  }

  /** Historial de un conductor específico (restringido a su empresa) */
  @Get('driver/:id')
  driverHistory(
    @Param('id', ParseIntPipe) id: number,
    @Query('days') days?: string,
    @CurrentUser() user?: CurrentUserData,
  ) {
    return this.service.getDriverHistory(id, days ? Number(days) : 30, user)
  }

  /**
   * POST /compliance/close-day
   * Cierra el día manualmente (para pruebas o corrección).
   * ADMIN solo cierra el día de su empresa; SUPER_ROOT puede omitir el filtro
   * (equivale al cron). En producción lo ejecuta el cron automáticamente.
   */
  @Post('close-day')
  closeDay(@Query('fecha') fecha?: string, @CurrentUser() user?: CurrentUserData) {
    const cid = user?.role === 'SUPER_ROOT' ? undefined : user?.companyId
    return this.service.closeDay(fecha, cid)
  }
}