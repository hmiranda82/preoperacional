import { createParamDecorator, ExecutionContext } from '@nestjs/common'

export interface CurrentUserData {
  id: number
  email: string
  role: string
  companyId: number
  /** Claim mcp del JWT: el usuario debe cambiar su contraseña antes de operar. */
  mustChangePassword?: boolean
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CurrentUserData => {
    const request = ctx.switchToHttp().getRequest()
    return request.user
  },
)
