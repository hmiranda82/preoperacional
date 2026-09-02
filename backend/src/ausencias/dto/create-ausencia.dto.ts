import { IsString, IsOptional, IsInt, IsDateString } from 'class-validator'

export class CreateAusenciaDto {
  @IsInt()
  driverId: number

  @IsDateString()
  fecha: string

  @IsOptional()
  @IsString()
  motivo?: string
}
