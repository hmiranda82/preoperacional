import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { ROLES_KEY } from '../decorators/roles.decorator'

/**
 * RolesGuard — usa el decorador @Roles() para restringir endpoints.
 * Debe aplicarse DESPUÉS de JwtAuthGuard (que popula request.user).
 *
 * Uso:
 *   @UseGuards(JwtAuthGuard, RolesGuard)
 *   @Roles('ADMIN')
 *   @Get('protected')
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ])

    // No @Roles() decorator → endpoint is accessible to any authenticated user
    if (!required || required.length === 0) return true

    const { user } = ctx.switchToHttp().getRequest()

    if (!user?.role) {
      throw new ForbiddenException('Sin información de rol en el token')
    }

    // SUPER_ROOT bypass: can access any endpoint regardless of @Roles()
    if (user.role.toUpperCase() === 'SUPER_ROOT') return true

    const hasRole = required.some(r => r.toUpperCase() === user.role.toUpperCase())
    if (!hasRole) {
      throw new ForbiddenException(
        `Acceso denegado. Se requiere rol: ${required.join(' o ')}`
      )
    }
    return true
  }
}
