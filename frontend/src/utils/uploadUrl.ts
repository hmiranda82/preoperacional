// Convierte una URL de imagen (antiguo formato /uploads/ o nuevo /api/uploads/)
// a la ruta protegida con token para que <img>/<a> puedan cargarla.
// El backend GET /api/uploads/:file acepta el JWT por query ?token=
const FILE_RE = /\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(?:jpg|jpeg|png|webp|heic|heif))$/i

export function uploadUrl(url: string | null | undefined): string {
  if (!url) return ''
  const m = url.match(FILE_RE)
  if (!m) return url
  const token = sessionStorage.getItem('token') || ''
  const base = (import.meta.env.VITE_API_URL || 'http://localhost:3458/api').replace(/\/+$/, '')
  const q = token ? `?token=${encodeURIComponent(token)}` : ''
  return `${base}/uploads/${m[1]}${q}`
}