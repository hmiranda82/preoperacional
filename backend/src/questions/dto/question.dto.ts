import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator'

export class CreateQuestionDto {
  @IsInt()
  formId: number

  @IsString()
  texto: string

  @IsEnum(['BOOLEAN', 'SINO', 'NUMERO', 'TEXTO'])
  tipo: 'BOOLEAN' | 'SINO' | 'NUMERO' | 'TEXTO'

  @IsOptional()
  @IsEnum(['TODOS', 'VEHICULO', 'MOTO', 'CONDUCTOR'])
  categoria?: 'TODOS' | 'VEHICULO' | 'MOTO' | 'CONDUCTOR'

  @IsOptional()
  @IsInt()
  @Min(0)
  orden?: number
}

export class UpdateQuestionDto {
  @IsOptional()
  @IsString()
  texto?: string

  @IsOptional()
  @IsEnum(['BOOLEAN', 'SINO', 'NUMERO', 'TEXTO'])
  tipo?: 'BOOLEAN' | 'SINO' | 'NUMERO' | 'TEXTO'

  @IsOptional()
  @IsEnum(['TODOS', 'VEHICULO', 'MOTO', 'CONDUCTOR'])
  categoria?: 'TODOS' | 'VEHICULO' | 'MOTO' | 'CONDUCTOR'

  @IsOptional()
  @IsInt()
  @Min(0)
  orden?: number

  @IsOptional()
  activo?: boolean
}
