import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common'
import { IsString, MinLength } from 'class-validator'
import { FormsService } from './forms.service'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { RolesGuard }   from '../common/guards/roles.guard'
import { Roles }        from '../common/decorators/roles.decorator'
import { CurrentUser }  from '../common/decorators/current-user.decorator'
import type { CurrentUserData } from '../common/decorators/current-user.decorator'

class CreateFormDto {
  @IsString()
  @MinLength(2, { message: 'El nombre del formulario debe tener al menos 2 caracteres' })
  nombre: string
}

@Controller('forms')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FormsController {
  constructor(private formsService: FormsService) {}

  @Get()
  findAll(@CurrentUser() user: CurrentUserData) {
    const companyId = user.role === 'SUPER_ROOT' ? undefined : user.companyId
    return this.formsService.findAll(companyId)
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
    const companyId = user.role === 'SUPER_ROOT' ? undefined : user.companyId
    return this.formsService.findOne(Number(id), companyId)
  }

  @Post()
  @Roles('ADMIN')
  create(@Body() dto: CreateFormDto, @CurrentUser() user: CurrentUserData) {
    return this.formsService.create(dto.nombre, user.companyId)
  }

  @Post('seed')
  @Roles('ADMIN')
  seed(@CurrentUser() user: CurrentUserData) {
    return this.formsService.seedFormPreoperacional(user.companyId)
  }
}
