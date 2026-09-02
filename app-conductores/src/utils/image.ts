const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
])

const DEFAULT_MAX_IMAGE_SIZE_MB = 8

export interface ImageValidationOptions {
  maxSizeInMb?: number
}

export interface ImageValidationResult {
  ok: boolean
  message?: string
}

export function validateImageFile(
  file: File,
  options: ImageValidationOptions = {},
): ImageValidationResult {
  const maxSizeInMb = options.maxSizeInMb ?? DEFAULT_MAX_IMAGE_SIZE_MB
  const maxSizeInBytes = maxSizeInMb * 1024 * 1024

  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return {
      ok: false,
      message: 'Formato no permitido. Usa JPG, PNG, WEBP o HEIC.',
    }
  }

  if (file.size > maxSizeInBytes) {
    return {
      ok: false,
      message: `La imagen supera el límite de ${maxSizeInMb} MB.`,
    }
  }

  return { ok: true }
}
