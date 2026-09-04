import { ExecutionContext, ForbiddenException } from '@nestjs/common'
import { JwtAuthGuard } from './jwt-auth.guard'
import { SKIP_PASSWORD_CHANGE_KEY } from '../decorators/skip-password-change.decorator'

/**
 * Unit tests del enforcement de cambio de contraseña en JwtAuthGuard.
 *
 * No monta un módulo Nest completo: se mockea super.canActivate (Passport) y
 * el Reflector para simular endpoints con/sin @SkipPasswordChange().
 */
describe('JwtAuthGuard - PASSWORD_CHANGE_REQUIRED', () => {
  // JwtAuthGuard extends AuthGuard('jwt'); el canActivate heredado vive en su prototipo padre.
  const basePrototype = Object.getPrototypeOf(JwtAuthGuard.prototype) as {
    canActivate: jest.SpyInstance | ((context: ExecutionContext) => Promise<boolean>)
  }

  const handler = () => undefined
  class TestClass {}

  const makeContext = (user: unknown): ExecutionContext =>
    ({
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
      getHandler: () => handler,
      getClass: () => TestClass,
    }) as unknown as ExecutionContext

  const makeReflector = (skipValue: boolean | undefined) =>
    ({ getAllAndOverride: jest.fn().mockReturnValue(skipValue) }) as any

  let spy: jest.SpyInstance

  beforeEach(() => {
    spy = jest.spyOn(basePrototype as any, 'canActivate').mockImplementation(async () => true)
  })

  afterEach(() => {
    spy.mockRestore()
  })

  it('deja pasar a un usuario normal (sin cambio pendiente) y ni consulta el reflector', async () => {
    const guard = new JwtAuthGuard(makeReflector(undefined))
    const result = await guard.canActivate(makeContext({ id: 1, mustChangePassword: false }))

    expect(result).toBe(true)
  })

  it('bloquea con PASSWORD_CHANGE_REQUIRED a un usuario con cambio pendiente', async () => {
    const guard = new JwtAuthGuard(makeReflector(undefined))

    await expect(guard.canActivate(makeContext({ id: 2, mustChangePassword: true }))).rejects.toThrow(
      ForbiddenException,
    )
  })

  it('el mensaje del 403 es exactamente PASSWORD_CHANGE_REQUIRED (contrato con los frontends)', async () => {
    const guard = new JwtAuthGuard(makeReflector(undefined))

    await expect(guard.canActivate(makeContext({ id: 2, mustChangePassword: true }))).rejects.toMatchObject({
      message: 'PASSWORD_CHANGE_REQUIRED',
    })
  })

  it('permite los endpoints decorados con @SkipPasswordChange (change-password, logout)', async () => {
    const reflector = makeReflector(true)
    const guard = new JwtAuthGuard(reflector)
    const result = await guard.canActivate(makeContext({ id: 3, mustChangePassword: true }))

    expect(result).toBe(true)
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(SKIP_PASSWORD_CHANGE_KEY, [handler, TestClass])
  })

  it('consulta el reflector solo para usuarios con cambio pendiente (handler y clase)', async () => {
    const reflector = makeReflector(undefined)
    const guard = new JwtAuthGuard(reflector)

    await expect(guard.canActivate(makeContext({ id: 4, mustChangePassword: true }))).rejects.toThrow()

    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(SKIP_PASSWORD_CHANGE_KEY, [handler, TestClass])
  })
})
