/**
 * Política de contraseñas (NIST SP 800-63B + OWASP ASVS v4.0.3)
 *
 * - Longitud: 8..72 (bcrypt trunca silenciosamente entradas > 72 bytes).
 * - SIN reglas arbitrarias de "mayúscula+minúscula+dígito+símbolo" (NIST las desaconseja:
 *   solo fomentan patrones predecibles). En su lugar se bloquean:
 *     · contraseñas de listas comunes (banlist)
 *     · secuencias de teclado/numéricas (>= 4 en línea, normal y reversa)
 *     · un carácter repetido
 *     · datos personales del usuario (correo/cédula)
 */

export const PASSWORD_MIN_LENGTH = 8
export const PASSWORD_MAX_BYTES = 72
export const RESET_TOKEN_HEX_LENGTH = 64
export const RESET_TOKEN_TTL_MINUTES = 30

const SEQUENCES = [
  '0123456789',
  'qwertyuiop',
  'asdfghjkl',
  'zxcvbnm',
  'azertyuiop',
  'qsdfghjklm',
  '0987654321',
]

const BANLIST = new Set([
  'password',
  'contraseña',
  'contrasena',
  '12345678',
  '123456789',
  '1234567890',
  'password1',
  'password123',
  'qwerty123',
  'abc12345',
  'letmein',
  'welcome',
  'admin',
  'admin123',
  'administrator',
  'iloveyou',
  'independencia',
  'colombia123',
  'medellin123',
  'bogota123',
  'cali123',
  'contrasena123',
  'clave123',
  'sistema123',
  'cambiar123',
  'cambiada',
  'temp1234',
  'temporal1',
  'usuario123',
  'clave1234',
  '12345678a',
  '123456789a',
  'a12345678',
  'password2024',
  'password2025',
  'password2026',
  'qwerty12345',
  '11111111',
  '00000000',
  'changeme',
  '12341234',
])

/** Valida fortaleza genérica. Devuelve null si es aceptable o un mensaje si no. */
export function passwordPolicyErrors(password: string): string | null {
  if (typeof password !== 'string' || password.length === 0) {
    return 'La contraseña es obligatoria'
  }
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres`
  }
  if (Buffer.byteLength(password, 'utf8') > PASSWORD_MAX_BYTES) {
    return `La contraseña no puede superar ${PASSWORD_MAX_BYTES} caracteres`
  }

  const normalized = password.toLowerCase()

  if (BANLIST.has(normalized)) {
    return 'Esa contraseña es demasiado común. Elige otra más segura'
  }

  // Un mismo carácter repetido 8+ veces en cualquier parte
  if (new RegExp(`(.)\\1{${PASSWORD_MIN_LENGTH - 1},}`).test(normalized)) {
    return 'Esa contraseña es demasiado simple. Elige otra más segura'
  }

  // Secuencias lineales de 4+ (hacia adelante o atrás)
  for (const seq of SEQUENCES) {
    for (let i = 0; i + 4 <= seq.length; i++) {
      const chunk = seq.substr(i, 4)
      if (normalized.includes(chunk) || normalized.includes([...chunk].reverse().join(''))) {
        return 'Esa contraseña es demasiado simple. Elige otra más segura'
      }
    }
  }

  return null
}

/** Valida contraseña en contexto del usuario (evita usar datos personales). */
export function passwordPolicyContextErrors(
  password: string,
  ctx: { email?: string | null; cedula?: string | null },
): string | null {
  const normalized = password.toLowerCase()

  if (ctx.email) {
    const local = ctx.email.split('@')[0]?.toLowerCase() ?? ''
    // Solo aplica a partes locales significativas (>= 6) y no genéricas:
    // evita falsos positivos como "admin@", "info@", "soporte@".
    const GENERIC = new Set(['admin', 'root', 'info', 'soporte', 'contacto', 'test', 'user', 'usuario', 'sistema'])
    if (local.length >= 6 && !GENERIC.has(local) && normalized.includes(local)) {
      return 'La contraseña no debe contener tu correo electrónico'
    }
  }

  if (ctx.cedula) {
    const digits = String(ctx.cedula)
    if (digits.length >= 4 && normalized.includes(digits.slice(-4))) {
      return 'La contraseña no debe contener tu cédula'
    }
  }

  return null
}