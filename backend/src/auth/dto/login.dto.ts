import { IsEmail, IsString, MinLength } from 'class-validator'

export class LoginDto {
  @IsEmail({}, { message: 'Correo electrónico inválido' })
  email: string

  // Nota: el login acepta 6+ para no bloquear contraseñas legacy ya existentes en BD.
  // La POLÍTICA de 8..72 se aplica al crear/cambiar/restablecer contraseñas.
  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string
}
