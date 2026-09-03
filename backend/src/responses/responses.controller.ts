import {
  Controller, Get, Post, Body, Param, Query,
  UseGuards, ForbiddenException, BadRequestException,
} from '@nestjs/common'
import { ResponsesService }  from './responses.service'
import { CreateResponseDto } from './dto/create-response.dto'
import { JwtAuthGuard }      from '../common/guards/jwt-auth.guard'
import { RolesGuard }        from '../common/guards/roles.guard'
import { Roles }             from '../common/decorators/roles.decorator'
import { CurrentUser }       from '../common/decorators/current-user.decorator'
import type { CurrentUserData } from '../common/decorators/current-user.decorator'

@Controller('responses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ResponsesController {
  constructor(private responsesService: ResponsesService) {}

  // Conductor submits their own inspection
  @Post()
  create(@Body() dto: CreateResponseDto, @CurrentUser() user: CurrentUserData) {
    return this.responsesService.create(dto, user.id)
  }

  // Check if current user already inspected today (any role)
  @Get('check')
  checkHoy(@CurrentUser() user: CurrentUserData) {
    return this.responsesService.checkInspeccionHoy(user.id)
  }

  // Admin reads all responses (últimas 500 — para el dashboard live)
  @Get()
  @Roles('ADMIN')
  findAll(@CurrentUser() user: CurrentUserData) {
    const companyId = user.role === 'SUPER_ROOT' ? undefined : user.companyId
    return this.responsesService.findAll(companyId)
  }

  /**
   * GET /responses/report?desde=YYYY-MM-DD&hasta=YYYY-MM-DD
   *
   * Respuestas en un rango de fechas, sin límite.
   * Usado por el reporte de cumplimiento del Dashboard.
   * Máximo recomendado: 31 días.
   */
  @Get('report')
  @Roles('ADMIN')
  findByRange(
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
    @CurrentUser() user?: CurrentUserData,
  ) {
    const today  = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date())
    const from   = desde ?? today
    const to     = hasta ?? today

    // Máximo 31 días para evitar queries de millones de filas
    const diff = (new Date(to).getTime() - new Date(from).getTime()) / 86_400_000
    if (diff > 31) {
      throw new BadRequestException('El rango máximo para el reporte es 31 días')
    }
    if (diff < 0) {
      throw new BadRequestException('La fecha "hasta" debe ser mayor o igual a "desde"')
    }

    const companyId = user?.role === 'SUPER_ROOT' ? undefined : user?.companyId
    return this.responsesService.findByRange(from, to, companyId)
  }

  // Conductors read their own history; admins can read anyone's (same company)
  @Get('user/:userId')
  findByUser(
    @Param('userId') userId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    const targetId = Number(userId)
    // Conductores solo pueden leer su propio historial
    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ROOT' && user.id !== targetId) {
      throw new ForbiddenException('Solo puedes ver tu propio historial')
    }
    return this.responsesService.findByUser(targetId, user)
  }

  @Get(':id')
  @Roles('ADMIN')
  findOne(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
    return this.responsesService.findOne(Number(id), user)
  }
}