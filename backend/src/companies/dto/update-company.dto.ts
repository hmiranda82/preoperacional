import { IsString, IsOptional, MaxLength, IsBoolean } from 'class-validator'

export class UpdateCompanyDto {
  @IsString()
  @IsOptional()
  @MaxLength(200)
  nombre?: string

  @IsString()
  @IsOptional()
  @MaxLength(100)
  subdomain?: string

  @IsBoolean()
  @IsOptional()
  activo?: boolean
}
