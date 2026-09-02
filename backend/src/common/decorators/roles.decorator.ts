import { SetMetadata } from '@nestjs/common'

export const ROLES_KEY = 'roles'

/**
 * Decorator @Roles('ADMIN') or @Roles('ADMIN', 'SUPERVISOR')
 * Used together with RolesGuard.
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles)
