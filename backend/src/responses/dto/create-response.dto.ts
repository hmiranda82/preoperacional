import { Type }        from 'class-transformer'
import {
  IsArray, IsNumber, IsOptional, IsString, ValidateNested,
} from 'class-validator'

/**
 * AnswerDto — respuesta a una pregunta del formulario.
 *
 * TIPOS DE PREGUNTA Y SUS VALORES DE RESPUESTA:
 * ──────────────────────────────────────────────
 *  BOOLEAN  → valor: 'OK'  (Bueno) | 'NO' (Malo)
 *             + observacion OBLIGATORIA cuando valor === 'NO'
 *
 *  SINO     → valor: 'SI' (Sí) | 'NO' (No)
 *             + observacion opcional
 *
 *  NUMERO   → valor: '150.5' (string numérico libre)
 *
 *  TEXTO    → valor: 'descripción libre'
 *
 * NOTAS:
 *  - imagenUrl es un campo INDEPENDIENTE del tipo de pregunta.
 *    Cualquier respuesta puede incluir una foto adjunta.
 *  - IMAGEN no es un tipo de pregunta válido en este sistema.
 *    Las fotos adjuntas se almacenan en imagenUrl, no en valor.
 */
export class AnswerDto {
  @IsNumber()
  questionId: number

  @IsOptional()
  @IsString()
  valor?: string    // 'OK' | 'NO' | 'SI' | '150' | 'texto libre'

  @IsOptional()
  @IsString()
  observacion?: string

  @IsOptional()
  @IsString()
  imagenUrl?: string    // URL de foto adjunta (independiente del tipo)
}

export class CreateResponseDto {
  @IsNumber()
  formId: number

  @IsString()
  placa: string

  @IsString()
  ciudad: string

  @IsString()
  contrato: string

  @IsOptional()
  @IsString()
  imagenVehiculoUrl?: string

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerDto)
  answers: AnswerDto[]
}