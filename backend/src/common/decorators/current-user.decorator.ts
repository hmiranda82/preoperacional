import { createParamDecorator, ExecutionContext } from '@nestjs/common'

export interface CurrentUserData {
  id: number
  email: string
  role: string
  companyId: number
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CurrentUserData => {
    const request = ctx.switchToHttp().getRequest()
    return request.user
  },
)
