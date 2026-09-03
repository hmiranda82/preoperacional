import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { NestExpressApplication } from '@nestjs/platform-express'
import { Logger, ValidationPipe } from '@nestjs/common'
import helmet from 'helmet'

const logger = new Logger('Bootstrap')

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule)

  const origins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim())
    : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost']

  // Helmet — cabeceras de seguridad HTTP (CSP, X-Frame-Options, etc.)
  // crossOriginResourcePolicy: 'cross-origin' permite que el admin SPA (otro origen)
  // muestre imágenes servidas por la API interna /api/uploads.
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  )

  app.enableCors({
    origin: origins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  })

  // Validación global: whitelist (ignora campos no declarados en DTOs),
  // transform (tipos), forbidNonWhitelisted (rechaza campos no declarados).
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  )

  // NOTA DE SEGURIDAD: los archivos de /uploads solo se sirven vía
  // GET /api/uploads/:file (protegido por JWT). No se montan estáticos públicos.

  // Trust proxy: detrás de Caddy/Nginx la IP real llega en X-Forwarded-For.
  // Sin esto, el rate limiting (Throttler) contaría todas las peticiones bajo
  // la IP del proxy y bloquearía a todos los usuarios colectivamente.
  // Configurar TRUST_PROXY=1 en producción (docker-compose ya lo hace).
  const trustProxy = process.env.TRUST_PROXY
  if (trustProxy) {
    app.getHttpAdapter().getInstance().set('trust proxy', trustProxy === 'true' ? 1 : Number(trustProxy) || trustProxy)
  }

  app.setGlobalPrefix('api')

  const port = process.env.PORT ?? 3000
  // HOST: en producción detrás de Caddy usar 127.0.0.1; en LAN/dev 0.0.0.0
  const host = process.env.HOST || '0.0.0.0'
  await app.listen(port, host)
  logger.log(`Server running on http://${host}:${port}`)
}

bootstrap()
