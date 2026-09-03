import {
  Controller, Get, Post, Put, Patch, Delete,
  Body, Param, Query, ParseIntPipe, UseGuards,
} from '@nestjs/common'
import { VacationsService } from './vacations.service'
import { CreateVacationDto } from './dto/create-vacation.dto'
import { UpdateVacationDto } from './dto/update-vacation.dto'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { RolesGuard } from '../common/guards/roles.guard'
import { Roles } from '../common/decorators/roles.decorator'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import type { CurrentUserData } from '../common/decorators/current-user.decorator'

@Controller('vacations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VacationsController {
  constructor(private readonly service: VacationsService) {}

  @Post()
  @Roles('ADMIN')
  create(@Body() dto: CreateVacationDto, @CurrentUser() user: CurrentUserData) {
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
    return this.service.isDriverOnVacation(driverId, user)
  }

  @Get(':id')
  @Roles('ADMIN', 'SUPER_ROOT')
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: CurrentUserData) {
    return this.service.findOne(id, user)
  }

  @Put(':id')
  @Roles('ADMIN')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateVacationDto, @CurrentUser() user: CurrentUserData) {
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
