import crypto from 'crypto'

function randHex(bytes) {
  return crypto.randomBytes(bytes).toString('hex')
}

function randPassword(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+'
  let result = ''
  const array = crypto.randomBytes(length)
  for (let i = 0; i < length; i++) {
    result += chars[array[i] % chars.length]
  }
  return result
}

console.log('═'.repeat(50))
console.log('  PREOPERACIONAL — Generador de Secretos')
console.log('═'.repeat(50))
console.log()
console.log('JWT_SECRET=' + randHex(64))
console.log('MYSQL_ROOT_PASSWORD=' + randPassword(30))
console.log('MYSQL_APP_PASSWORD=' + randPassword(30))
console.log()
console.log('⚠️  Copia estos valores a tu archivo .env')
console.log('⚠️  NO los compartas ni los subas al repositorio')
