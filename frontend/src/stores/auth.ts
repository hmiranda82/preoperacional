import { defineStore } from 'pinia'
import api from '../api'

interface AuthUser {
  id: number
  nombre: string
  email: string
  cedula: string
  placa?: string
  rol: 'ADMIN' | 'CONDUCTOR' | 'SUPER_ROOT'
}

interface AuthState {
  token: string
  user: AuthUser | null
  refreshToken: string
}

function decodeTokenPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    return JSON.parse(atob(parts[1]!))
  } catch {
    return null
  }
}

function buildUserFromPayload(payload: Record<string, unknown>): AuthUser | null {
  if (!payload.sub) return null
  return {
    id: payload.sub as number,
    email: (payload.email as string) || '',
    rol: (payload.role as 'ADMIN' | 'CONDUCTOR' | 'SUPER_ROOT') || 'CONDUCTOR',
    nombre: '',
    cedula: '',
  }
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => {
    const token = sessionStorage.getItem('token') || ''
    const refreshToken = sessionStorage.getItem('refresh_token') || ''
    let user: AuthUser | null = null
    if (token) {
      const payload = decodeTokenPayload(token)
      if (payload) {
        user = buildUserFromPayload(payload)
      }
    }
    return { token, user, refreshToken }
  },

  getters: {
    isLoggedIn: (state): boolean => !!state.token,
    isAdmin: (state): boolean => state.user?.rol === 'ADMIN' || state.user?.rol === 'SUPER_ROOT',
    isSuperRoot: (state): boolean => state.user?.rol === 'SUPER_ROOT',
  },

  actions: {
    async login(email: string, password: string) {
      const res = await api.post<{ access_token: string; refresh_token: string; user: AuthUser }>(
        '/auth/login',
        { email, password },
      )
      this.token = res.data.access_token
      this.refreshToken = res.data.refresh_token
      this.user = res.data.user
      sessionStorage.setItem('token', this.token)
      sessionStorage.setItem('refresh_token', this.refreshToken)
    },

    async superLogin(email: string, password: string) {
      const res = await api.post<{ access_token: string; refresh_token: string; user: AuthUser }>(
        '/auth/super-login',
        { email, password },
      )
      this.token = res.data.access_token
      this.refreshToken = res.data.refresh_token
      this.user = res.data.user
      sessionStorage.setItem('token', this.token)
      sessionStorage.setItem('refresh_token', this.refreshToken)
    },

    setUser(user: AuthUser) {
      this.user = user
    },

    async logout() {
      this.token = ''
      this.refreshToken = ''
      this.user = null
      sessionStorage.removeItem('token')
      sessionStorage.removeItem('refresh_token')
      try {
        await api.post('/auth/logout-all')
      } catch {
        // Ignore errors — session will be stale
      }
    },
  },
})
