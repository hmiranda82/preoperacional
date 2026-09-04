import api from '../api'

/**
 * Carga de imágenes protegidas SIN token en la URL (?token=JWT se filtra por
 * logs de servidor, historial del navegador y referrer). El archivo se descarga
 * con header Authorization y se expone como object URL efímero (blob:).
 * El endpoint GET /api/uploads/:file ya valida el header JWT.
 */
const FILE_RE = /\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(?:jpg|jpeg|png|webp|heic|heif))$/i

export function isUploadFile(url: string | null | undefined): boolean {
  return !!url && FILE_RE.test(url)
}

async function fetchBlob(objectPath: string): Promise<Blob | null> {
  try {
    const res = await api.get(objectPath, { responseType: 'blob' })
    return res.data as Blob
  } catch {
    return null
  }
}

/** Object URL efímero para <img>; '' si no se pudo cargar. */
export async function fetchUploadBlobUrl(url: string | null | undefined): Promise<string> {
  if (!isUploadFile(url)) return ''
  const m = (url as string).match(FILE_RE)!
  const blob = await fetchBlob(`/uploads/${m[1]}`)
  return blob ? URL.createObjectURL(blob) : ''
}

/** Abre la foto en pestaña nueva con sesión autenticada (reemplaza <a href="...?token=">). */
export async function openUpload(url: string | null | undefined): Promise<void> {
  if (!isUploadFile(url)) return
  const m = (url as string).match(FILE_RE)!
  const blob = await fetchBlob(`/uploads/${m[1]}`)
  if (!blob) return
  const blobUrl = URL.createObjectURL(blob)
  window.open(blobUrl, '_blank', 'noopener')
  // La pestaña nueva ya recibió el blob; revocamos tras margen prudencial.
  setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000)
}
