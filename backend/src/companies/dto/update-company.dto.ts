import { IsString, IsOptional, MaxLength, IsBoolean } from 'class-validator'

export class UpdateCompanyDto {
  @IsString()
  @IsOptional()
  @MaxLength(200)
  nombre?: string

  @IsBoolean()
  @IsOptional()
  activo?: boolean
}
