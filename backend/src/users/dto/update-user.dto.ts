import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator'
import { Transform } from 'class-transformer'

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @Matches(/^\d{6,12}$/, {
    message: 'La cédula debe tener entre 6 y 12 dígitos',
  })
  cedula?: string

  @IsOptional()
  @IsString()
  nombre?: string

  @IsOptional()
  @IsEmail({}, { message: 'Correo electrónico inválido' })
  email?: string

  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  password?: string

  @IsOptional()
  @Transform(({ value, obj }) => value ?? obj?.rol)
  @IsEnum(['ADMIN', 'DRIVER', 'CONDUCTOR', 'SUPER_ROOT'], { message: 'Rol inválido' })
  role?: 'ADMIN' | 'DRIVER' | 'CONDUCTOR' | 'SUPER_ROOT'

  @IsOptional()
  @Transform(({ value, obj }) => value ?? obj?.activo)
  @IsBoolean()
  isActive?: boolean

  @IsOptional()
  @Transform(({ value }) => value || undefined)
  @IsString()
  telefono?: string

  @IsOptional()
  @Transform(({ value }) => value || undefined)
  @IsString()
  placa?: string

  @IsOptional()
  @Transform(({ value }) => value || undefined)
  @IsString()
  ciudad?: string

  @IsOptional()
  @Transform(({ value }) => value || undefined)
  @IsDateString({}, { message: 'Fecha SOAT inválida (formato ISO: YYYY-MM-DD)' })
  soatVigencia?: string

  @IsOptional()
  @Transform(({ value }) => value || undefined)
  @IsDateString({}, {
    message: 'Fecha Tecnomecánica inválida (formato ISO: YYYY-MM-DD)',
  })
  tecniVigencia?: string

  @IsOptional()
  @IsEnum(['ACTIVO', 'INACTIVO'], { message: 'Estado de conductor inválido' })
  estado?: 'ACTIVO' | 'INACTIVO'

  @IsOptional()
  @IsString()
  @Matches(/^([0-6](,[0-6])*)?$/, { message: 'diasLaborales debe ser una lista separada por comas de 0-6 (ej: 1,2,3,4,5)' })
  diasLaborales?: string

  @IsOptional()
  @IsObject({ message: 'Permisos debe ser un objeto JSON válido' })
  permisos?: Record<string, unknown>
}
