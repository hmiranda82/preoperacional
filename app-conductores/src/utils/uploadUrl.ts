import { getApiUrl } from '../config/env'
import { getStorageItem } from '../lib/storage'
import { AUTH_STORAGE_KEYS } from '../constants/storage'

// Convierte una URL de imagen a la ruta protegida con token (?token=JWT) para
// que <img>/<a> puedan cargarla desde GET /api/uploads/:file.
const FILE_RE = /\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(?:jpg|jpeg|png|webp|heic|heif))$/i

export function uploadUrl(url: string | null | undefined): string {
  if (!url) return ''
  const m = url.match(FILE_RE)
  if (!m) return url
  const token = getStorageItem(AUTH_STORAGE_KEYS.token)
  const base = `${getApiUrl()}/api`.replace(/\/+$/, '')
  const q = token ? `?token=${encodeURIComponent(token)}` : ''
  return `${base}/uploads/${m[1]}${q}`
}