import { Controller, Get, UseGuards } from '@nestjs/common'
import { DashboardService } from './dashboard.service'
import { JwtAuthGuard }    from '../common/guards/jwt-auth.guard'
import { RolesGuard }      from '../common/guards/roles.guard'
import { Roles }           from '../common/decorators/roles.decorator'
import { CurrentUser }     from '../common/decorators/current-user.decorator'
import type { CurrentUserData } from '../common/decorators/current-user.decorator'

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  /** Resumen compacto del dashboard — KPIs, alertas y últimas revisiones */
  @Get('summary')
  summary(@CurrentUser() user: CurrentUserData) {
    const cid = user.role === 'SUPER_ROOT' ? undefined : user.companyId
    return this.service.getSummary(cid)
  }
}