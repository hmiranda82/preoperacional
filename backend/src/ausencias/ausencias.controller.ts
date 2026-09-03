import {
  Controller, Get, Post, Put, Patch, Delete,
  Body, Param, Query, ParseIntPipe, UseGuards,
} from '@nestjs/common'
import { AusenciasService } from './ausencias.service'
import { CreateAusenciaDto } from './dto/create-ausencia.dto'
import { UpdateAusenciaDto } from './dto/update-ausencia.dto'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { RolesGuard } from '../common/guards/roles.guard'
import { Roles } from '../common/decorators/roles.decorator'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import type { CurrentUserData } from '../common/decorators/current-user.decorator'

@Controller('ausencias')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AusenciasController {
  constructor(private readonly service: AusenciasService) {}

  @Post()
  @Roles('ADMIN')
  create(@Body() dto: CreateAusenciaDto, @CurrentUser() user: CurrentUserData) {
    return this.service.create(dto, user)
  }

  @Get()
  findAll(@CurrentUser() user: CurrentUserData) {
    const cid = user.role === 'SUPER_ROOT' ? undefined : user.companyId
    return this.service.findAll(cid)
  }

  @Get('range')
  @Roles('ADMIN')
  findByRange(
    @Query('desde') desde: string,
    @Query('hasta') hasta: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    const cid = user.role === 'SUPER_ROOT' ? undefined : user.companyId
    return this.service.findByRange(desde, hasta, cid)
  }

  @Get('check/:driverId')
  @Roles('ADMIN', 'DRIVER')
  checkDriver(@Param('driverId', ParseIntPipe) driverId: number, @CurrentUser() user: CurrentUserData) {
    return this.service.isDriverOnAusencia(driverId, user)
  }

  @Get(':id')
  @Roles('ADMIN', 'SUPER_ROOT')
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: CurrentUserData) {
    return this.service.findOne(id, user)
  }

  @Put(':id')
  @Roles('ADMIN')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateAusenciaDto, @CurrentUser() user: CurrentUserData) {
    return this.service.update(id, dto, user)
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: CurrentUserData) {
    return this.service.remove(id, user)
  }

  @Patch(':id/cancel')
  @Roles('ADMIN')
  cancel(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: CurrentUserData) {
    return this.service.cancel(id, user)
  }
}
