import { passwordPolicyErrors, passwordPolicyContextErrors } from './password-policy'

describe('passwordPolicyErrors', () => {
  it('acepta una contraseña fuerte', () => {
    expect(passwordPolicyErrors('Tr4bajo#Seguro-2026!')).toBeNull()
  })

  it('rechaza longitudes fuera de 8..72', () => {
    expect(passwordPolicyErrors('')).not.toBeNull()
    expect(passwordPolicyErrors('Ab1')).not.toBeNull()
    expect(passwordPolicyErrors('S3gur@a!'.repeat(10))).not.toBeNull() // 80 > 72 bytes
  })

  it('rechaza la lista común sin importar mayúsculas', () => {
    expect(passwordPolicyErrors('PassWord')).not.toBeNull()
    expect(passwordPolicyErrors('CONTRASEÑA')).not.toBeNull()
    expect(passwordPolicyErrors('12345678')).not.toBeNull()
  })

  it('rechaza secuencias numéricas/teclado en 4+ (normal y reversa)', () => {
    expect(passwordPolicyErrors('abcd1234')).not.toBeNull()
    expect(passwordPolicyErrors('Xyzqwert987')).not.toBeNull()
    expect(passwordPolicyErrors('4321dcba!')).not.toBeNull()
    expect(passwordPolicyErrors('qqqwerttyy')).not.toBeNull()
  })

  it('rechaza un carácter repetido', () => {
    expect(passwordPolicyErrors('aaaaaaaa1')).not.toBeNull()
  })

  it('acepta secuencias menores a 4 consecutivas', () => {
    expect(passwordPolicyErrors('ab12#ZzZc')).toBeNull()
  })
})

describe('passwordPolicyContextErrors', () => {
  it('rechaza la parte local del correo en la contraseña', () => {
    expect(passwordPolicyErrors('Carlos1984#!') ?? passwordPolicyContextErrors('Carlos1984#!', { email: 'carlos@empresa.com' }))
      .not.toBeNull()
  })

  it('no aplica la regla de correo para partes locales genéricas/cortas (ej. admin@)', () => {
    expect(passwordPolicyContextErrors('PreopAdmin_b0e084360ac5f8924116', { email: 'admin@preoperacional.com' }))
      .toBeNull()
  })

  it('rechaza los últimos 4 dígitos de la cédula', () => {
    const err = passwordPolicyErrors('MiClav3-6789') ?? passwordPolicyContextErrors('MiClav3-6789', { cedula: '123456789' })
    expect(err).not.toBeNull()
  })

  it('acepta cuando no hay contexto conflictivo', () => {
    const err = passwordPolicyErrors('Vitrinas#Mar2026') ?? passwordPolicyContextErrors('Vitrinas#Mar2026', { email: 'p.rodriguez@empresa.com', cedula: '987654321' })
    expect(err).toBeNull()
  })
})