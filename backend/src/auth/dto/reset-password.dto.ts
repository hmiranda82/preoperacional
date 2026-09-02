import { IsString, Matches, MinLength } from 'class-validator'
import { RESET_TOKEN_HEX_LENGTH } from '../../common/password-policy'

export class ResetPasswordDto {
  @IsString()
  @Matches(new RegExp(`^[0-9a-f]{${RESET_TOKEN_HEX_LENGTH}}$`), {
    message: 'Token de restablecimiento inválido',
  })
  token: string

  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  new_password: string
}