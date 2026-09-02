import {
  Controller,
  Get,
  Post,
  Param,
  Res,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
  UseGuards,
} from '@nestjs/common'
import type { Response } from 'express'
import { FileInterceptor } from '@nestjs/platform-express'
import { diskStorage } from 'multer'
import { extname, join } from 'path'
import { randomUUID } from 'crypto'
import { existsSync, mkdirSync, unlinkSync, readFileSync } from 'fs'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { QueryTokenAuthGuard } from './uploads.auth.guard'

const UPLOADS_DIR = join(process.cwd(), 'uploads')

// Ensure uploads directory exists
if (!existsSync(UPLOADS_DIR)) {
  mkdirSync(UPLOADS_DIR, { recursive: true })
}

const ALLOWED_MIMETYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
]

const MAGIC_BYTES: Record<string, Uint8Array[]> = {
  'image/jpeg': [new Uint8Array([0xFF, 0xD8, 0xFF])],
  'image/jpg': [new Uint8Array([0xFF, 0xD8, 0xFF])],
  'image/png': [new Uint8Array([0x89, 0x50, 0x4E, 0x47])],
  'image/webp': [new Uint8Array([0x52, 0x49, 0x46, 0x46])],
  'image/heic': [new Uint8Array([0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70])],
  'image/heif': [new Uint8Array([0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70])],
}

const MAX_FILE_SIZE = 10 * 1024 * 1024

// Solo se permiten nombres generados por el propio sistema (UUID + extensión)
const SAFE_FILENAME_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|jpeg|png|webp|heic|heif)$/i

function validateMagicBytes(filePath: string, mimetype: string): boolean {
  try {
    const buffer = readFileSync(filePath)
    const signatures = MAGIC_BYTES[mimetype]
    if (!signatures) return false
    return signatures.some(sig => {
      if (buffer.length < sig.length) return false
      for (let i = 0; i < sig.length; i++) {
        if (buffer[i] !== sig[i]) return false
      }
      return true
    })
  } catch {
    return false
  }
}

@Controller('uploads')
@UseGuards(QueryTokenAuthGuard, JwtAuthGuard)
export class UploadsController {
  @Get(':filename')
  getImage(@Param('filename') filename: string, @Res() res: Response) {
    if (!SAFE_FILENAME_RE.test(filename)) {
      throw new BadRequestException('Nombre de archivo inválido')
    }
    const filePath = join(UPLOADS_DIR, filename)
    if (!existsSync(filePath)) {
      throw new NotFoundException('Archivo no encontrado')
    }
    res.setHeader('Content-Disposition', 'inline')
    res.setHeader('Cache-Control', 'private, max-age=3600')
    res.setHeader('X-Content-Type-Options', 'nosniff')
    return res.sendFile(filePath)
  }

  @Post('image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: UPLOADS_DIR,
        filename: (_req, file, cb) => {
          const ext = extname(file.originalname).toLowerCase()
          const safeExts = ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif']
          const finalExt = safeExts.includes(ext) ? ext : '.jpg'
          const unique = `${randomUUID()}${finalExt}`
          cb(null, unique)
        },
      }),
      limits: { fileSize: MAX_FILE_SIZE },
      fileFilter: (_req, file, cb) => {
        if (!ALLOWED_MIMETYPES.includes(file.mimetype)) {
          return cb(
            new BadRequestException('Formato no permitido. Usa JPG, PNG, WEBP o HEIC.'),
            false,
          )
        }
        cb(null, true)
      },
    }),
  )
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No se recibió ningún archivo')

    if (!file.path || !existsSync(file.path)) {
      throw new InternalServerErrorException('El archivo no se almacenó correctamente')
    }

    if (!validateMagicBytes(file.path, file.mimetype)) {
      unlinkSync(file.path)
      throw new BadRequestException('El archivo no es una imagen válida')
    }

    const baseUrl = (process.env.API_URL || 'http://localhost:3000').replace(/\/+$/, '')
    return {
      url: `${baseUrl}/api/uploads/${file.filename}`,
      filename: file.filename,
    }
  }
}
