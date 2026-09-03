import { Controller, Get, Query, UseGuards, BadRequestException } from '@nestjs/common'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { RolesGuard } from '../common/guards/roles.guard'
import { Roles } from '../common/decorators/roles.decorator'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { ReportsService, type ExecutiveReport } from './reports.service'

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('executive')
  @Roles('ADMIN', 'SUPER_ROOT')
  async getExecutiveReport(
    @Query('year') year?: string,
    @Query('month') month?: string,
    @Query('companyId') companyId?: string,
    @Query('ciudad') ciudad?: string,
    @Query('supervisorId') supervisorId?: string,
    @Query('driverId') driverId?: string,
    @CurrentUser() user?: any,
  ): Promise<ExecutiveReport> {
    const now = new Date()
    const targetYear = year ? parseInt(year, 10) : now.getFullYear()
    const targetMonth = month ? parseInt(month, 10) : now.getMonth() + 1

    if (targetMonth < 1 || targetMonth > 12) {
      throw new BadRequestException('Mes inválido (1-12)')
    }
    if (targetYear < 2020 || targetYear > 2100) {
      throw new BadRequestException('Año inválido')
    }

    const companyIdNum = companyId ? parseInt(companyId, 10) : undefined
    const supervisorIdNum = supervisorId ? parseInt(supervisorId, 10) : undefined
    const driverIdNum = driverId ? parseInt(driverId, 10) : undefined

    // Filter by user's company unless SUPER_ROOT
    const effectiveCompanyId = user?.role === 'SUPER_ROOT' ? companyIdNum : (user?.companyId || undefined)

    return this.reportsService.getExecutiveReport({
      year: targetYear,
      month: targetMonth,
      companyId: effectiveCompanyId,
      ciudad: ciudad || undefined,
      supervisorId: supervisorIdNum,
      driverId: driverIdNum,
      usuario: user?.email || 'Administrador',
    })
  }
}
