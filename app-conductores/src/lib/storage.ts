export function getStorageItem(key: string): string {
  if (typeof window === 'undefined') return ''
  return window.localStorage.getItem(key) || ''
}

export function removeStorageItem(key: string): void {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(key)
}

export function setStorageItem(key: string, value: string): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(key, value)
}

export function getStorageJson<T>(key: string): T | null {
  const raw = getStorageItem(key)
  if (!raw) return null

  try {
    return JSON.parse(raw) as T
  } catch {
    removeStorageItem(key)
    return null
  }
}

export function setStorageJson(key: string, value: unknown): void {
  setStorageItem(key, JSON.stringify(value))
}
