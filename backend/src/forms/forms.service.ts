import { Injectable, NotFoundException } from '@nestjs/common'
import { QuestionType, VehicleCategory } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'

interface CreateQuestionData {
  formId:    number
  texto:     string
  tipo:      QuestionType
  categoria: VehicleCategory   // FIX: faltaba en la versión anterior
  orden:     number
}

@Injectable()
export class FormsService {
  constructor(private prisma: PrismaService) {}

  async findAll(companyId?: number) {
    const where: any = { activo: true }
    if (companyId) where.companyId = companyId
    const forms = await this.prisma.form.findMany({
      where,
      include: {
        questions: {
          where:   { activo: true },
          orderBy: { orden: 'asc' },
        },
      },
    })
    if (forms.length === 0 && companyId) {
      await this.seedFormPreoperacional(companyId)
      return this.findAll(companyId)
    }
    return forms
  }

  async findOne(id: number, companyId?: number) {
    const where: any = { id }
    if (companyId) where.companyId = companyId
    const form = await this.prisma.form.findFirst({
      where,
      include: {
        questions: {
          where:   { activo: true },
          orderBy: { orden: 'asc' },
        },
      },
    })
    if (!form) throw new NotFoundException(`Formulario #${id} no encontrado`)
    return form
  }

  async create(nombre: string, companyId: number) {
    return this.prisma.form.create({ data: { nombre, companyId } })
  }

  async createQuestion(data: CreateQuestionData) {
    return this.prisma.question.create({ data })
  }

  async seedFormPreoperacional(companyId: number) {
    const existe = await this.prisma.form.findFirst({
      where: { nombre: 'Inspección Preoperacional', companyId },
    })
    if (existe) {
      return { message: 'El formulario ya existe', form: existe }
    }

    const form = await this.prisma.form.create({
      data: { nombre: 'Inspección Preoperacional', companyId },
    })

    /**
     * Tipos de respuesta por pregunta:
     *   QuestionType.BOOLEAN → Bueno / Malo  (componentes mecánicos)
     *   QuestionType.SINO    → Sí / No       (confirmación personal)
     *   QuestionType.TEXTO   → texto libre   (observaciones)
     *
     * Categorías por tipo de vehículo:
     *   VehicleCategory.TODOS    → aplica a todos
     *   VehicleCategory.VEHICULO → solo vehículos de 4 ruedas
     *   VehicleCategory.MOTO     → solo motocicletas
     *   VehicleCategory.CONDUCTOR → preguntas del conductor
     */
    const preguntas: Omit<CreateQuestionData, 'formId'>[] = [
      { texto: '¿Estado de las llantas (delanteras y traseras)?',                       tipo: QuestionType.BOOLEAN, categoria: VehicleCategory.TODOS,     orden: 1  },
      { texto: '¿Niveles y estado del sistema de frenos?',                              tipo: QuestionType.BOOLEAN, categoria: VehicleCategory.TODOS,     orden: 2  },
      { texto: '¿Estado de la dirección y espejos?',                                    tipo: QuestionType.BOOLEAN, categoria: VehicleCategory.TODOS,     orden: 3  },
      { texto: '¿Estado de las luces (externas e internas, incluyendo direccionales)?', tipo: QuestionType.BOOLEAN, categoria: VehicleCategory.TODOS,     orden: 4  },
      { texto: '¿El vehículo está libre de fugas de líquido (aceite o gasolina)?',    tipo: QuestionType.BOOLEAN, categoria: VehicleCategory.TODOS,     orden: 5  },
      { texto: '¡Nivel de aceite y combustible?',                                       tipo: QuestionType.BOOLEAN, categoria: VehicleCategory.TODOS,     orden: 6  },
      { texto: '¿Estado del kit de arrastre?',                                          tipo: QuestionType.BOOLEAN, categoria: VehicleCategory.VEHICULO,  orden: 7  },
      { texto: '¿Estado del casco?',                                                    tipo: QuestionType.BOOLEAN, categoria: VehicleCategory.MOTO,      orden: 8  },
      { texto: '¿Estado de los guantes de protección?',                                 tipo: QuestionType.BOOLEAN, categoria: VehicleCategory.MOTO,      orden: 9  },
      { texto: '¿Estado de las botas?',                                                 tipo: QuestionType.BOOLEAN, categoria: VehicleCategory.MOTO,      orden: 10 },
      // FIX: Era BOOLEAN, debe ser SINO — pregunta de confirmación personal, no evaluación mecánica
      { texto: '¿Se encuentra en condiciones de salud para conducir?',                  tipo: QuestionType.SINO,    categoria: VehicleCategory.TODOS,     orden: 11 },
      { texto: 'Observaciones generales de la jornada laboral',                         tipo: QuestionType.TEXTO,   categoria: VehicleCategory.TODOS,     orden: 12 },
    ]

    for (const p of preguntas) {
      await this.prisma.question.create({
        data: { formId: form.id, ...p },
      })
    }

    return form
  }
}