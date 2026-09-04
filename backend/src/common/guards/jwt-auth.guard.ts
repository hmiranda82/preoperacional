import { ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { AuthGuard } from '@nestjs/passport'
import { SKIP_PASSWORD_CHANGE_KEY } from '../decorators/skip-password-change.decorator'

/**
 * Guard de autenticación JWT con enforcement de cambio de contraseña:
 *
 * 1. Valida el token (Passport 'jwt') y popula request.user.
 * 2. Si el token trae mcp=true (mustChangePassword emitido en el login), el
 *    usuario SOLO puede usar los endpoints decorados con @SkipPasswordChange()
 *    (cambiar su contraseña y cerrar sesión). Todo lo demás responde 403
 *    PASSWORD_CHANGE_REQUIRED, que los frontends traducen a la pantalla de cambio.
 *
 * Mientras el flag esté activo, la ventana de ataque de una contraseña temporal
 * se reduce a cero: no se puede leer ni escribir nada de la empresa.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super()
  }

  handleRequest(err: any, user: any) {
    if (err || !user) {
      throw new UnauthorizedException('Token inválido o expirado')
    }
    return user
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const authenticated = (await super.canActivate(context)) as boolean

    const request = context.switchToHttp().getRequest()
    const user = request.user as { mustChangePassword?: boolean } | undefined

    if (user?.mustChangePassword) {
      const skip = this.reflector.getAllAndOverride<boolean>(SKIP_PASSWORD_CHANGE_KEY, [
        context.getHandler(),
        context.getClass(),
      ])
      if (!skip) {
        throw new ForbiddenException('PASSWORD_CHANGE_REQUIRED')
      }
    }

    return authenticated
  }
}
