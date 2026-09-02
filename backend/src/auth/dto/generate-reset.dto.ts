import { Type } from 'class-transformer'
import { IsInt, Min } from 'class-validator'

export class GenerateResetDto {
  @IsInt({ message: 'userId debe ser un entero' })
  @Min(1)
  @Type(() => Number)
  userId: number
}