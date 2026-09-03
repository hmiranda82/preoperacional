/**
 * Validación de variables de entorno en el bootstrap (fail-fast).
 *
 * ConfigModule invoca esta función al iniciar la aplicación: si falta
 * algo esencial, el proceso NO arranca. Antes JWT_SECRET fallaba recién
 * en el primer request (InternalErrorException), lo que dejaba el
 * servicio "sano" pero inutilizable.
 */
export function validateEnv(config: Record<string, unknown>): Record<string, unknown> {
  const errors: string[] = []

  if (!config.JWT_SECRET) {
    errors.push('JWT_SECRET es obligatorio')
  }

  const nodeEnv = String(config.NODE_ENV || 'development')
  if (nodeEnv === 'production') {
    if (!config.CORS_ORIGINS) {
      errors.push('CORS_ORIGINS es obligatorio en producción (define los orígenes https reales)')
    }
    const secret = String(config.JWT_SECRET || '')
    if (secret.length < 32) {
      errors.push('JWT_SECRET debe tener al menos 32 caracteres en producción')
    }
  }

  if (errors.length > 0) {
    throw new Error(`Configuración de entorno inválida → ${errors.join(' | ')}`)
  }

  return config
}
