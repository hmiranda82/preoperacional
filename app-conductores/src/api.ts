import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { getApiUrl } from './config/env'
import { AUTH_STORAGE_KEYS } from './constants/storage'
import { getStorageItem, removeStorageItem, setStorageItem } from './lib/storage'

function clearAuthStorage(): void {
  removeStorageItem(AUTH_STORAGE_KEYS.token)
  removeStorageItem(AUTH_STORAGE_KEYS.refreshToken)
  removeStorageItem(AUTH_STORAGE_KEYS.user)
}

function redirectToLogin(): void {
  if (typeof window === 'undefined') return
  const currentPath = window.location.pathname + window.location.search
  const isAlreadyOnLogin = window.location.pathname === '/login'

  if (!isAlreadyOnLogin) {
    const params = new URLSearchParams({ from: 'expired', redirect: currentPath })
    window.location.replace(`/login?${params.toString()}`)
  }
}

const api = axios.create({
  timeout: 20000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

// Helper: ensure the URL has the /api prefix
function resolveApiUrl(): string {
  const raw = getApiUrl().replace(/\/+$/, '')
  return raw.endsWith('/api') ? raw : raw + '/api'
}

// Set baseURL dynamically on every request so server URL changes take effect
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getStorageItem(AUTH_STORAGE_KEYS.token)
  const baseUrl = resolveApiUrl()

  config.baseURL = baseUrl

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

let isRefreshing = false
let failedQueue: Array<{ resolve: (v: any) => void; reject: (e: any) => void }> = []

function processQueue(error: any, token: string | null = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error)
    else resolve(token)
  })
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }
    const status = error.response?.status
    const url = originalRequest?.url ?? ''

    if (url === '/auth/login' || url === '/auth/refresh') {
      return Promise.reject(error)
    }

    if (status === 401 && !originalRequest._retry) {
      const refreshToken = getStorageItem(AUTH_STORAGE_KEYS.refreshToken)

      if (!refreshToken) {
        clearAuthStorage()
        redirectToLogin()
        return Promise.reject(error)
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const { data } = await axios.post(`${resolveApiUrl()}/auth/refresh`, {
          refresh_token: refreshToken,
        })

        setStorageItem(AUTH_STORAGE_KEYS.token, data.access_token)
        setStorageItem(AUTH_STORAGE_KEYS.refreshToken, data.refresh_token)

        processQueue(null, data.access_token)
        originalRequest.headers.Authorization = `Bearer ${data.access_token}`
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        clearAuthStorage()
        redirectToLogin()
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  },
)

export default api
