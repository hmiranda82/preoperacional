import { runSeed, getAdminSeedPassword, getSuperRootPassword } from './seed'

/**
 * Unit tests del seed de bootstrap.
 *
 * Contrato del seed de producción (primer arranque del despliegue):
 *   - Crea EXACTAMENTE 1 usuario: SUPER_ROOT, con cambio de contraseña forzado.
 *   - NO crea el ADMIN (lo crea el SUPER_ROOT desde el panel).
 *   - Crea el formulario preoperacional con sus 12 preguntas.
 *   - En re-ejecuciones nunca re-activa el cambio forzado ni toca contraseñas.
 */
describe('seed (bootstrap)', () => {
  const makePrisma = () => ({
    company: { upsert: jest.fn().mockResolvedValue({ id: 1, nombre: 'Empresa Principal' }) },
    user: {
      findUnique: jest.fn().mockResolvedValue(null),
      // Devuelve {email} del where para que el log del seed funcione
      upsert: jest
        .fn()
        .mockImplementation((args: any) => Promise.resolve({ email: args.where.email })),
    },
    driver: { delete: jest.fn().mockResolvedValue({}) },
    form: { findFirst: jest.fn().mockResolvedValue(null), create: jest.fn().mockResolvedValue({ id: 1 }) },
    question: { create: jest.fn().mockResolvedValue({}) },
  })

  const ENV_BACKUP = { ...process.env }

  beforeEach(() => {
    jest.resetModules()
  })

  afterEach(() => {
    process.env = { ...ENV_BACKUP }
  })

  describe('producción (NODE_ENV=production)', () => {
    it('crea EXACTAMENTE 1 usuario: SUPER_ROOT con mustChangePassword=true, sin ADMIN', async () => {
      process.env.NODE_ENV = 'production'
      process.env.SUPER_ROOT_PASSWORD = 'ProdSecret#2026xZ'
      delete process.env.ADMIN_SEED_PASSWORD
      const prisma = makePrisma()

      await runSeed(prisma as any)

      // Solo hay un upsert de usuario y es el SUPER_ROOT
      expect(prisma.user.upsert).toHaveBeenCalledTimes(1)
      const args = prisma.user.upsert.mock.calls[0][0]
      expect(args.where.email).toBe('root@system.local')
      expect(args.create.mustChangePassword).toBe(true)
      expect(args.create.role).toBe('SUPER_ROOT')

      // El branch del admin nunca se consulta (no existe flujo de admin)
      expect(prisma.user.findUnique).not.toHaveBeenCalled()
    })

    it('crea el formulario con las 12 preguntas', async () => {
      process.env.NODE_ENV = 'production'
      process.env.SUPER_ROOT_PASSWORD = 'ProdSecret#2026xZ'
      const prisma = makePrisma()

      await runSeed(prisma as any)

      expect(prisma.form.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ nombre: 'Inspección Preoperacional' }) }),
      )
      expect(prisma.question.create).toHaveBeenCalledTimes(12)
    })

    it('en re-ejecución (usuario ya existe) NO re-activa el cambio forzado', async () => {
      process.env.NODE_ENV = 'production'
      process.env.SUPER_ROOT_PASSWORD = 'ProdSecret#2026xZ'
      const prisma = makePrisma()

      await runSeed(prisma as any)
      await runSeed(prisma as any)

      const updateArgs = prisma.user.upsert.mock.calls[0][0].update
      expect(updateArgs).not.toHaveProperty('mustChangePassword')
      expect(updateArgs).not.toHaveProperty('password')
    })

    it('aborta sin SUPER_ROOT_PASSWORD definida (nunca siembra credencial en claro)', () => {
      process.env.NODE_ENV = 'production'
      delete process.env.SUPER_ROOT_PASSWORD

      expect(() => getSuperRootPassword()).toThrow(/SUPER_ROOT_PASSWORD/)
    })
  })

  describe('desarrollo (NODE_ENV=development)', () => {
    it('conserva el comportamiento histórico: ADMIN + SUPER_ROOT sin cambio forzado', async () => {
      process.env.NODE_ENV = 'development'
      delete process.env.SUPER_ROOT_PASSWORD
      delete process.env.ADMIN_SEED_PASSWORD
      const prisma = makePrisma()

      await runSeed(prisma as any)

      // Dos upserts: admin + super root
      expect(prisma.user.upsert).toHaveBeenCalledTimes(2)
      const emails = prisma.user.upsert.mock.calls.map((c) => c[0].where.email)
      expect(emails).toEqual(['admin@preoperacional.com', 'root@system.local'])

      const superArgs = prisma.user.upsert.mock.calls[1][0]
      expect(superArgs.create.mustChangePassword).toBeUndefined()
    })

    it('usa fallbacks locales (admin123 / superRoot2024!) solo fuera de producción', () => {
      process.env.NODE_ENV = 'development'
      delete process.env.ADMIN_SEED_PASSWORD
      delete process.env.SUPER_ROOT_PASSWORD

      expect(getAdminSeedPassword()).toBe('admin123')
      expect(getSuperRootPassword()).toBe('superRoot2024!')
    })
  })
})
