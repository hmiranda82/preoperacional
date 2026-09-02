import axios from 'axios'

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3458/api').replace(/\/+$/, '')

const api = axios.create({
  baseURL: API_BASE,
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

// ── Request: attach JWT token ────────────────────────────────
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── Response: handle global errors ──────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status
    const url    = error.config?.url ?? ''
    const originalRequest = error.config

    if (url.includes('/auth/refresh')) {
      return Promise.reject(error)
    }

    const isAuthEndpoint = url.includes('/auth/login')

    // ── 401 en login → rechazar sin más ──
    if (status === 401 && isAuthEndpoint) {
      return Promise.reject(error)
    }

    // ── 401 en página de login → rechazar sin más ──
    if (status === 401 && window.location.pathname === '/login') {
      return Promise.reject(error)
    }

    // ── 401 → intentar refresh token ──
    if (status === 401 && !originalRequest._retry) {
      const refreshToken = sessionStorage.getItem('refresh_token')
      if (!refreshToken) {
        sessionStorage.removeItem('token')
        sessionStorage.removeItem('refresh_token')
        window.location.href = '/login'
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
        const { data } = await axios.post(
          `${API_BASE}/auth/refresh`,
          { refresh_token: refreshToken },
        )
        sessionStorage.setItem('token', data.access_token)
        sessionStorage.setItem('refresh_token', data.refresh_token)
        processQueue(null, data.access_token)
        originalRequest.headers.Authorization = `Bearer ${data.access_token}`
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        sessionStorage.removeItem('token')
        sessionStorage.removeItem('refresh_token')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  },
)

export default api