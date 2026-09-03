import { ForbiddenException } from '@nestjs/common'
import type { CurrentUserData } from './decorators/current-user.decorator'

export type TenantCaller = Pick<CurrentUserData, 'id' | 'role' | 'companyId'>

/**
 * Aislamiento multi-tenant: verifica que el recurso pertenezca a la empresa
 * del usuario autenticado. SUPER_ROOT opera entre empresas; cualquier otro
 * rol solo puede acceder a recursos de su propia empresa.
 *
 * Usar en todo endpoint que reciba un ID del cliente y opere sobre un
 * recurso con empresa (directa o vía driver.user.companyId).
 */
export function assertSameCompany(
  caller: TenantCaller,
  targetCompanyId: number | null | undefined,
): void {
  if (caller.role === 'SUPER_ROOT') return
  if (targetCompanyId == null || Number(targetCompanyId) !== Number(caller.companyId)) {
    throw new ForbiddenException('No tienes permisos sobre recursos de otra empresa')
  }
}
