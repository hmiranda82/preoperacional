import { SetMetadata } from '@nestjs/common'

export const SKIP_PASSWORD_CHANGE_KEY = 'skipPasswordChange'

/**
 * Marca un endpoint como accesible para usuarios con cambio de contraseña
 * pendiente (mustChangePassword=true). El JwtAuthGuard bloquea todos los
 * demás endpoints mientras el flag esté activo.
 *
 * Úsalo SOLO en endpoints seguros de transición: change-password y logout.
 */
export const SkipPasswordChange = () => SetMetadata(SKIP_PASSWORD_CHANGE_KEY, true)
