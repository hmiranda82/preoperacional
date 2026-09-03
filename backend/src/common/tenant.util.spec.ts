import { ForbiddenException } from '@nestjs/common'
import { assertSameCompany } from './tenant.util'

describe('assertSameCompany (aislamiento multi-tenant)', () => {
  const adminCo1 = { id: 1, role: 'ADMIN', companyId: 1 }
  const superRoot = { id: 2, role: 'SUPER_ROOT', companyId: 1 }

  it('permite al ADMIN acceder a recursos de su propia empresa', () => {
    expect(() => assertSameCompany(adminCo1, 1)).not.toThrow()
  })

  it('bloquea al ADMIN de otra empresa con ForbiddenException', () => {
    expect(() => assertSameCompany(adminCo1, 2)).toThrow(ForbiddenException)
  })

  it('permite a SUPER_ROOT operar entre empresas', () => {
    expect(() => assertSameCompany(superRoot, 99)).not.toThrow()
  })

  it('bloquea target sin empresa definida para no-SUPER_ROOT', () => {
    expect(() => assertSameCompany(adminCo1, null)).toThrow(ForbiddenException)
    expect(() => assertSameCompany(adminCo1, undefined)).toThrow(ForbiddenException)
  })

  it('SUPER_ROOT pasa incluso con target sin empresa', () => {
    expect(() => assertSameCompany(superRoot, null)).not.toThrow()
  })

  it('compara numéricamente (string "1" vs number 1)', () => {
    expect(() => assertSameCompany(adminCo1, '1' as unknown as number)).not.toThrow()
  })
})
