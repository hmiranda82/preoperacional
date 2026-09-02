import { Controller, Get, Put, Delete, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common'
import { CompaniesService } from './companies.service'
import { UpdateCompanyDto } from './dto/update-company.dto'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { RolesGuard } from '../common/guards/roles.guard'
import { Roles } from '../common/decorators/roles.decorator'

@Controller('companies')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CompaniesController {
  constructor(private companiesService: CompaniesService) {}

  @Get()
  @Roles('SUPER_ROOT')
  findAll() {
    return this.companiesService.findAll()
  }

  @Get(':id')
  @Roles('SUPER_ROOT')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.companiesService.findById(id)
  }

  @Put(':id')
  @Roles('SUPER_ROOT')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCompanyDto) {
    return this.companiesService.update(id, dto)
  }

  @Delete(':id')
  @Roles('SUPER_ROOT')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.companiesService.delete(id)
  }
}
