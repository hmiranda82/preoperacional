import { IsString, IsOptional, IsDateString, IsInt, IsArray } from 'class-validator'

export class CreateVacationDto {
  @IsInt()
  driverId: number

  @IsDateString()
  fechaInicio: string

  @IsDateString()
  fechaFin: string

  @IsOptional()
  @IsString()
  motivo?: string

  @IsArray()
  @IsDateString({}, { each: true })
  days: string[]
}
