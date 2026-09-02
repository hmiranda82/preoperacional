import { IsString, Matches } from 'class-validator'

export class RefreshDto {
  @IsString({ message: 'refresh_token debe ser un string' })
  @Matches(/^[0-9a-f]{96}$/, { message: 'refresh_token inválido' })
  refresh_token: string
}