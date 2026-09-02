import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('Iniciando seed...')

  // ── 0. EMPRESA PREDETERMINADA ───────────────────────────
  const empresa = await prisma.company.upsert({
    where:  { id: 1 },
    update: { nombre: 'Empresa Principal' },
    create: { id: 1, nombre: 'Empresa Principal' },
  })
  console.log(`✅ Empresa predeterminada: ${empresa.nombre}`)

  // ── 1. ADMIN ─────────────────────────────────────────────
  const email    = 'admin@preoperacional.com'
  const password = 'admin123'
  const hash     = await bcrypt.hash(password, 12)

  const existing = await prisma.user.findUnique({
    where:   { email },
    include: { admin: true, driver: true },
  })

  if (existing?.driver) {
    await prisma.driver.delete({ where: { userId: existing.id } })
  }

  const admin = await prisma.user.upsert({
    where:  { email },
    update: {
      // SEGURIDAD: NO se reescribe la contraseña si el usuario ya existe.
      // Así el seed nunca resetea credenciales ya establecidas.
      companyId: 1, role: 'ADMIN', isActive: true,
      admin: existing?.admin
        ? { update:  { cedula: '123456789', nombre: 'Administrador Principal', permisos: { usuarios: true, formularios: true, reportes: true } } }
        : { create:  { cedula: '123456789', nombre: 'Administrador Principal', permisos: { usuarios: true, formularios: true, reportes: true } } },
    },
    create: {
      companyId: 1, email, password: hash, role: 'ADMIN', isActive: true,
      admin: { create: { cedula: '123456789', nombre: 'Administrador Principal', permisos: { usuarios: true, formularios: true, reportes: true } } },
    },
    include: { admin: true },
  })

    console.log(`✅ Admin listo: ${admin.email}`)

  // ── 1b. SUPER_ROOT ─────────────────────────────────────────
  const superEmail    = 'root@system.local'
  const superPassword = 'superRoot2024!'
  const superHash     = await bcrypt.hash(superPassword, 12)

  const superExisting = await prisma.user.findUnique({
    where:   { email: superEmail },
    include: { admin: true },
  })

  const superRoot = await prisma.user.upsert({
    where:  { email: superEmail },
    update: {
      // SEGURIDAD: NO se reescribe la contraseña si ya existe (idem admin)
      companyId: 1, role: 'SUPER_ROOT', isActive: true,
    },
    create: {
      companyId: 1, email: superEmail, password: superHash, role: 'SUPER_ROOT', isActive: true,
    },
    include: { admin: true },
  })

  console.log(`✅ Super Root listo: ${superRoot.email} / ${superPassword}`)

  // ── 2. FORMULARIO PREOPERACIONAL ─────────────────────────
  const formExiste = await prisma.form.findFirst({
    where: { nombre: 'Inspección Preoperacional', companyId: 1 },
  })

  if (formExiste) {
    console.log('✅ Formulario ya existe, omitiendo creación.')
  } else {
    const form = await prisma.form.create({
      data: { companyId: 1, nombre: 'Inspección Preoperacional', activo: true },
    })

    /**
     * TIPOS DE RESPUESTA VÁLIDOS:
     *   BOOLEAN → Bueno / Malo  (preguntas sobre estado de componentes mecánicos)
     *   SINO    → Sí / No       (preguntas de condición personal / confirmación)
     *   NUMERO  → valor numérico libre
     *   TEXTO   → descripción libre
     *
     * CATEGORÍAS VÁLIDAS:
     *   TODOS    → aplica a todo tipo de vehículo
     *   VEHICULO → solo vehículos (carro, camioneta, camión)
     *   MOTO     → solo motocicletas
     *   CONDUCTOR → preguntas personales del conductor
     *
     * CORRECCIÓN: "¿Se encuentra en condiciones de salud?" es tipo SINO (Sí/No)
     * No es BOOLEAN (Bueno/Malo), ya que es una pregunta de confirmación personal.
     */
    const preguntas = [
      // ── Vehículo general (TODOS) ───────────────────────────────────
      { texto: '¿Estado de las llantas (delanteras y traseras)?',                       tipo: 'BOOLEAN', categoria: 'TODOS',     orden: 1  },
      { texto: '¿Niveles y estado del sistema de frenos?',                              tipo: 'BOOLEAN', categoria: 'TODOS',     orden: 2  },
      { texto: '¿Estado de la dirección y espejos?',                                    tipo: 'BOOLEAN', categoria: 'TODOS',     orden: 3  },
      { texto: '¿Estado de las luces (externas e internas, incluyendo direccionales)?', tipo: 'BOOLEAN', categoria: 'TODOS',     orden: 4  },
      { texto: '¿El vehículo está libre de fugas de líquido (aceite o gasolina)?',    tipo: 'BOOLEAN', categoria: 'TODOS',     orden: 5  },
      { texto: '¡Nivel de aceite y combustible?',                                       tipo: 'BOOLEAN', categoria: 'TODOS',     orden: 6  },

      // ── Solo vehículo (camioneta/carro/camión) ─────────────────────
      { texto: '¿Estado del kit de arrastre?',                                          tipo: 'BOOLEAN', categoria: 'VEHICULO',  orden: 7  },

      // ── Solo moto ──────────────────────────────────────────────────
      { texto: '¿Estado del casco?',                                                    tipo: 'BOOLEAN', categoria: 'MOTO',      orden: 8  },
      { texto: '¿Estado de los guantes de protección?',                                 tipo: 'BOOLEAN', categoria: 'MOTO',      orden: 9  },
      { texto: '¿Estado de las botas?',                                                 tipo: 'BOOLEAN', categoria: 'MOTO',      orden: 10 },

      // ── Conductor (personal) ───────────────────────────────────────
      // CORREGIDO: tipo SINO (Sí/No), no BOOLEAN (Bueno/Malo)
      // "¿Se encuentra en condiciones de salud?" es una pregunta de confirmación
      // personal, no una evaluación de estado mecánico.
      { texto: '¿Se encuentra en condiciones de salud para conducir?',                  tipo: 'SINO',    categoria: 'TODOS',     orden: 11 },

      // ── Texto libre ────────────────────────────────────────────────
      { texto: 'Observaciones generales de la jornada laboral',                         tipo: 'TEXTO',   categoria: 'TODOS',     orden: 12 },
    ]

    for (const p of preguntas) {
      await prisma.question.create({
        data: {
          formId:    form.id,
          texto:     p.texto,
          tipo:      p.tipo as any,
          categoria: p.categoria as any,
          orden:     p.orden,
          activo:    true,
        },
      })
    }

    console.log(`✅ Formulario creado con ${preguntas.length} preguntas.`)
    console.log('   Tipos usados: BOOLEAN (mecánico), SINO (conductor), TEXTO (observaciones)')
  }

  console.log('\n🚀 Seed completado.')
  console.log('   Cambia la contraseña del admin después del primer login.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())