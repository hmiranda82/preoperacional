import { Injectable, NotFoundException, ConflictException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { UpdateCompanyDto } from './dto/update-company.dto'

@Injectable()
export class CompaniesService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.company.findMany({ orderBy: { nombre: 'asc' } })
  }

  async findById(id: number) {
    const company = await this.prisma.company.findUnique({ where: { id } })
    if (!company) throw new NotFoundException(`Empresa #${id} no encontrada`)
    return company
  }

  async update(id: number, dto: UpdateCompanyDto) {
    await this.findById(id)
    return this.prisma.company.update({ where: { id }, data: dto })
  }

  async delete(id: number) {
    await this.findById(id)
    const count = await this.prisma.user.count({ where: { companyId: id } })
    if (count > 0) {
      throw new ConflictException(`No se puede eliminar: ${count} usuario(s) pertenecen a esta empresa`)
    }
    return this.prisma.company.delete({ where: { id } })
  }
}
