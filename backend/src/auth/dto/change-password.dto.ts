import { IsString, MinLength } from 'class-validator'

export class ChangePasswordDto {
  @IsString()
  current_password: string

  @IsString()
  @MinLength(8, { message: 'La contraseña nueva debe tener al menos 8 caracteres' })
  new_password: string
}