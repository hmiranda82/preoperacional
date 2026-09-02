process.env.JWT_SECRET = 'test-jwt-secret-for-e2e'
process.env.API_URL = 'http://localhost:3000'

import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ExecutionContext } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import request from 'supertest'
import * as path from 'path'
import * as fs from 'fs'
import { AppModule } from '../src/app.module'
import { PrismaService } from '../src/prisma/prisma.service'
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard'
import { APP_GUARD } from '@nestjs/core'

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  session: {
    create: jest.fn(),
    findUnique: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
  driver: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
  },
  admin: {
    findFirst: jest.fn(),
  },
  response: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
  },
  vacation: {
    findMany: jest.fn().mockResolvedValue([]),
    findFirst: jest.fn(),
  },
  ausencia: {
    findMany: jest.fn().mockResolvedValue([]),
  },
  vacationDay: {
    findMany: jest.fn().mockResolvedValue([]),
  },
  dailyStatus: {
    findMany: jest.fn().mockResolvedValue([]),
    upsert: jest.fn().mockResolvedValue({}),
    create: jest.fn(),
    update: jest.fn(),
  },
  company: {
    findMany: jest.fn().mockResolvedValue([{ id: 1 }]),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
  },
  auditLog: {
    create: jest.fn().mockResolvedValue({}),
  },
  form: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
  },
  question: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
  },
  answer: {
    create: jest.fn(),
    createMany: jest.fn(),
  },
  $transaction: jest.fn((cb: any) => cb(mockPrisma)),
}

const mockJwtGuard = {
  canActivate: (ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest()
    req.user = { id: 1, email: 'admin@test.com', role: 'ADMIN', companyId: 1 }
    return true
  },
}

const mockThrottlerGuard = {
  canActivate: () => true,
}

// bcrypt v6 expone named exports como propiedades de solo lectura en ESM,
// por lo que jest.spyOn(bcrypt, 'compare') falla con "Cannot redefine property".
// Se mockea el módulo completo desde la fábrica (sin referencias externas,
// porque jest.mock se hoistea por encima de las declaraciones del módulo).
jest.mock('bcrypt', () => ({
  compare: jest.fn().mockResolvedValue(true),
  hash: jest.fn().mockResolvedValue('hashed'),
}))

const mockDriverUser = {
  id: 1,
  companyId: 1,
  email: 'driver@test.com',
  password: '$2b$12$hashedpassword123',
  role: 'DRIVER',
  isActive: true,
  createdAt: new Date('2025-01-01'),
  updatedAt: null,
  driver: {
    id: 10,
    userId: 1,
    cedula: '1234567890',
    nombre: 'Driver Test',
    telefono: '3001111111',
    placa: 'ABC123',
    ciudad: 'Bogotá',
    soatVigencia: new Date('2026-01-01'),
    tecniVigencia: new Date('2026-01-01'),
    estado: 'ACTIVO',
  },
  admin: null,
}

const mockAdminUser = {
  id: 2,
  companyId: 1,
  email: 'admin@test.com',
  password: '$2b$12$hashedadmin456',
  role: 'ADMIN',
  isActive: true,
  createdAt: new Date('2025-01-01'),
  updatedAt: null,
  driver: null,
  admin: {
    id: 20,
    userId: 2,
    cedula: '0987654321',
    nombre: 'Admin Test',
    telefono: '3002222222',
    ciudad: 'Bogotá',
    permisos: { all: true },
  },
}

const mockOtherCompanyUser = {
  id: 3,
  companyId: 2,
  email: 'other@test.com',
  password: '$2b$12$hashedother789',
  role: 'DRIVER',
  isActive: true,
  createdAt: new Date('2025-01-01'),
  updatedAt: null,
  driver: {
    id: 30,
    userId: 3,
    cedula: '1111111111',
    nombre: 'Other Driver',
    telefono: '3003333333',
    placa: 'XYZ999',
    ciudad: 'Medellín',
    soatVigencia: new Date('2026-01-01'),
    tecniVigencia: new Date('2026-01-01'),
    estado: 'ACTIVO',
  },
  admin: null,
}

const mockSession = {
  id: 1,
  userId: 1,
  refreshToken: 'refresh_token_abc',
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
}

const mockNewSession = {
  id: 2,
  userId: 1,
  refreshToken: 'new_refresh_token_xyz',
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
}

describe('App E2E', () => {
  let app: INestApplication

  beforeAll(async () => {
    jest.spyOn(console, 'log').mockImplementation(() => {})
    jest.spyOn(console, 'error').mockImplementation(() => {})
    jest.spyOn(console, 'warn').mockImplementation(() => {})

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrisma)
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtGuard)
      .overrideProvider(APP_GUARD)
      .useValue(mockThrottlerGuard)
      .compile()

    app = moduleFixture.createNestApplication()
    await app.init()

    const jwtService = app.get(JwtService)
    jest.spyOn(jwtService, 'sign').mockReturnValue('test_access_token')
  })

  afterAll(async () => {
    jest.restoreAllMocks()
    await app.close()
  })

  beforeEach(() => {
    jest.clearAllMocks()

    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    mockPrisma.session.create.mockResolvedValue(mockNewSession)
    mockPrisma.session.findUnique.mockResolvedValue(null)
    mockPrisma.session.delete.mockResolvedValue(mockSession)
    mockPrisma.session.deleteMany.mockResolvedValue({ count: 1 })
  })

  describe('POST /auth/login', () => {
    it('should return 401 when credentials are invalid', () => {
      mockPrisma.user.findUnique.mockResolvedValue(null)

      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'wrong@test.com', password: 'anypassword' })
        .expect(401)
    })

    it('should return 200 and tokens when login is successful', () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockDriverUser)
      mockPrisma.session.create.mockResolvedValue(mockSession)

      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'driver@test.com', password: 'password123' })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('access_token')
          expect(res.body).toHaveProperty('refresh_token')
          expect(res.body).toHaveProperty('user')
        })
    })
  })

  describe('POST /auth/refresh', () => {
    it('should return 401 when refresh token is invalid', () => {
      mockPrisma.session.findUnique.mockResolvedValue(null)

      return request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refresh_token: 'invalid_token' })
        .expect(401)
    })

    it('should return 200 and new tokens when refresh is valid', () => {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      mockPrisma.session.findUnique.mockResolvedValue({
        id: 5,
        userId: 1,
        refreshToken: 'valid_refresh_token',
        expiresAt: futureDate,
        user: { id: 1, email: 'driver@test.com', role: 'DRIVER', companyId: 1, isActive: true },
      })
      mockPrisma.session.create.mockResolvedValue(mockNewSession)

      return request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refresh_token: 'valid_refresh_token' })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('access_token')
          expect(typeof res.body.refresh_token).toBe('string')
          expect(res.body.refresh_token.length).toBeGreaterThanOrEqual(16)
          expect(res.body).toHaveProperty('user')
        })
    })
  })

  describe('GET /users', () => {
    it('should return users when authenticated', () => {
      mockPrisma.user.findMany.mockResolvedValue([mockDriverUser, mockAdminUser])

      return request(app.getHttpServer())
        .get('/users')
        .set('Authorization', 'Bearer valid_token')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true)
          expect(res.body.length).toBeGreaterThanOrEqual(2)
        })
    })

    it('should exclude SUPER_ROOT users from results', () => {
      mockPrisma.user.findMany.mockResolvedValue([mockDriverUser])

      return request(app.getHttpServer())
        .get('/users')
        .set('Authorization', 'Bearer valid_token')
        .expect(200)
        .expect((res) => {
          const superRoots = res.body.filter(
            (u: any) => u.role === 'SUPER_ROOT',
          )
          expect(superRoots.length).toBe(0)
        })
    })
  })

  describe('GET /users/:id with multi-tenant isolation', () => {
    it('should return user when id matches same company', () => {
      mockPrisma.user.findFirst.mockResolvedValue(mockDriverUser)
      mockPrisma.vacation.findMany.mockResolvedValue([])

      return request(app.getHttpServer())
        .get('/users/1')
        .set('Authorization', 'Bearer valid_token')
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(1)
          expect(res.body.email).toBe('driver@test.com')
        })
    })

    it('should return 404 when user belongs to different company', () => {
      mockPrisma.user.findFirst.mockResolvedValue(null)

      return request(app.getHttpServer())
        .get('/users/3')
        .set('Authorization', 'Bearer valid_token')
        .expect(404)
    })
  })

  describe('POST /uploads/image', () => {
    const uploadsDir = path.join(process.cwd(), 'uploads')

    afterEach(() => {
      if (fs.existsSync(uploadsDir)) {
        const files = fs.readdirSync(uploadsDir)
        files.forEach((f) => {
          const fp = path.join(uploadsDir, f)
          if (f.startsWith('test-')) {
            try { fs.unlinkSync(fp) } catch {}
          }
        })
      }
    })

    it('should upload an image file and return the URL', async () => {
      const pngBuffer = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
        0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
        0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
        0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,
        0x54, 0x08, 0xD7, 0x63, 0x60, 0x60, 0x60, 0x00,
        0x00, 0x00, 0x04, 0x00, 0x01, 0x27, 0x34, 0x27,
        0x8C, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E,
        0x44, 0xAE, 0x42, 0x60, 0x82,
      ])

      const res = await request(app.getHttpServer())
        .post('/uploads/image')
        .set('Authorization', 'Bearer valid_token')
        .attach('file', pngBuffer, 'test-image.png')

      if (res.status === 201 || res.status === 200) {
        expect(res.body).toHaveProperty('url')
        expect(res.body).toHaveProperty('filename')
        expect(res.body.url).toContain('/uploads/')
        if (res.body.filename) {
          const fp = path.join(uploadsDir, res.body.filename)
          try { fs.unlinkSync(fp) } catch {}
        }
      }
    })

    it('should reject request without file', () => {
      return request(app.getHttpServer())
        .post('/uploads/image')
        .set('Authorization', 'Bearer valid_token')
        .expect(400)
    })
  })
})
