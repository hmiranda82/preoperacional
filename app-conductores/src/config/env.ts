export function getApiUrl(): string {
  const raw = (import.meta.env.VITE_API_URL || '').trim()
  return raw.replace(/\/+$/, '') || 'http://localhost:3458'
}

export const env = {
  get apiUrl() { return getApiUrl() },
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
}
