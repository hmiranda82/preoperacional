import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common'

/**
 * QueryTokenAuthGuard — antes de que JwtAuthGuard valide el token, si la
 * petición llega sin header Authorization pero con `?token=...` (uso típico
 * en <img src=".../uploads/x.jpg?token=JWT">), rellena el header para que el
 * guard de JWT lo valide normalmente.
 *
 * Debe declararse SIEMPRE ANTES que JwtAuthGuard.
 */
@Injectable()
export class QueryTokenAuthGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const request = ctx.switchToHttp().getRequest()
    if (!request.headers?.authorization && request.query?.token) {
      request.headers.authorization = `Bearer ${request.query.token}`
    }
    return true
  }
}