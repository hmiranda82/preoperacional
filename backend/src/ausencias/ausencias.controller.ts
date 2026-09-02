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
  create(@Body() dto: CreateAusenciaDto) {
    return this.service.create(dto)
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
  checkDriver(@Param('driverId', ParseIntPipe) driverId: number) {
    return this.service.isDriverOnAusencia(driverId)
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id)
  }

  @Put(':id')
  @Roles('ADMIN')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateAusenciaDto) {
    return this.service.update(id, dto)
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id)
  }

  @Patch(':id/cancel')
  @Roles('ADMIN')
  cancel(@Param('id', ParseIntPipe) id: number) {
    return this.service.cancel(id)
  }
}
