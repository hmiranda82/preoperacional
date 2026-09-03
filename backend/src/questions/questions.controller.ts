import {
  Controller, Get, Post, Put, Patch,
  Delete, Body, Param, Query, UseGuards,
  HttpCode, HttpStatus,
} from '@nestjs/common'
import { QuestionsService }                    from './questions.service'
import { CreateQuestionDto, UpdateQuestionDto } from './dto/question.dto'
import { JwtAuthGuard }                        from '../common/guards/jwt-auth.guard'
import { RolesGuard }                          from '../common/guards/roles.guard'
import { Roles }                               from '../common/decorators/roles.decorator'
import { CurrentUser }                         from '../common/decorators/current-user.decorator'
import type { CurrentUserData }                from '../common/decorators/current-user.decorator'

@Controller('questions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class QuestionsController {
  constructor(private questionsService: QuestionsService) {}

  // Read — any authenticated user (driver app reads questions for the form)
  @Get()
  findAll(@Query('formId') formId?: string, @CurrentUser() user?: CurrentUserData) {
    const companyId = user?.role === 'SUPER_ROOT' ? undefined : user?.companyId
    return this.questionsService.findAll(formId ? Number(formId) : undefined, companyId)
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user?: CurrentUserData) {
    const companyId = user?.role === 'SUPER_ROOT' ? undefined : user?.companyId
    return this.questionsService.findOne(Number(id), companyId)
  }

  // Write — ADMIN only
  @Post()
  @Roles('ADMIN')
  create(@Body() dto: CreateQuestionDto, @CurrentUser() user: CurrentUserData) {
    const companyId = user.role === 'SUPER_ROOT' ? undefined : user.companyId
    return this.questionsService.create(dto, companyId)
  }

  @Put(':id')
  @Roles('ADMIN')
  update(@Param('id') id: string, @Body() dto: UpdateQuestionDto, @CurrentUser() user: CurrentUserData) {
    const companyId = user.role === 'SUPER_ROOT' ? undefined : user.companyId
    return this.questionsService.update(Number(id), dto, companyId)
  }

  @Patch(':id/toggle')
  @Roles('ADMIN')
  toggle(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
    const companyId = user.role === 'SUPER_ROOT' ? undefined : user.companyId
    return this.questionsService.toggleActivo(Number(id), companyId)
  }

  @Delete(':id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
    const companyId = user.role === 'SUPER_ROOT' ? undefined : user.companyId
    return this.questionsService.remove(Number(id), companyId)
  }
}
