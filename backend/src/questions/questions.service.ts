import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateQuestionDto, UpdateQuestionDto } from './dto/question.dto'

@Injectable()
export class QuestionsService {
  constructor(private prisma: PrismaService) {}

  async findAll(formId?: number, companyId?: number) {
    return this.prisma.question.findMany({
      where: {
        ...(formId ? { formId } : {}),
        ...(companyId ? { form: { companyId } } : {}),
      },
      orderBy: [{ orden: 'asc' }],
      include: { form: { select: { nombre: true, companyId: true } } },
    })
  }

  async findOne(id: number) {
    const q = await this.prisma.question.findUnique({ where: { id } })
    if (!q) throw new NotFoundException(`Pregunta #${id} no encontrada`)
    return q
  }

  async create(dto: CreateQuestionDto, companyId?: number) {
    if (companyId && dto.formId) {
      const form = await this.prisma.form.findUnique({ where: { id: dto.formId } })
      if (!form || form.companyId !== companyId) {
        throw new NotFoundException(`Formulario #${dto.formId} no encontrado`)
      }
    }
    return this.prisma.question.create({ data: dto })
  }

  async update(id: number, dto: UpdateQuestionDto, companyId?: number) {
    const question = await this.prisma.question.findUnique({
      where: { id },
      include: { form: { select: { companyId: true } } },
    })
    if (!question) throw new NotFoundException(`Pregunta #${id} no encontrada`)
    if (companyId && question.form.companyId !== companyId) {
      throw new NotFoundException(`Pregunta #${id} no encontrada`)
    }
    return this.prisma.question.update({ where: { id }, data: dto })
  }

  async toggleActivo(id: number, companyId?: number) {
    const question = await this.prisma.question.findUnique({
      where: { id },
      include: { form: { select: { companyId: true } } },
    })
    if (!question) throw new NotFoundException(`Pregunta #${id} no encontrada`)
    if (companyId && question.form.companyId !== companyId) {
      throw new NotFoundException(`Pregunta #${id} no encontrada`)
    }
    return this.prisma.question.update({
      where: { id },
      data: { activo: !question.activo },
    })
  }

  async remove(id: number, companyId?: number) {
    const question = await this.prisma.question.findUnique({
      where: { id },
      include: { form: { select: { companyId: true } } },
    })
    if (!question) throw new NotFoundException(`Pregunta #${id} no encontrada`)
    if (companyId && question.form.companyId !== companyId) {
      throw new NotFoundException(`Pregunta #${id} no encontrada`)
    }
    return this.prisma.question.delete({ where: { id } })
  }
}
