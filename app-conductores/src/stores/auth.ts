import { defineStore } from 'pinia'
import { AUTH_STORAGE_KEYS } from '../constants/storage'
import { getStorageItem, getStorageJson, removeStorageItem, setStorageItem, setStorageJson } from '../lib/storage'
import { loginRequest } from '../services/auth.service'
import type { AuthUser } from '../types'

interface AuthState {
  token: string
  refreshToken: string
  user: AuthUser | null
  mustChangePassword: boolean
}

function clearPersistedSession(): void {
  removeStorageItem(AUTH_STORAGE_KEYS.token)
  removeStorageItem(AUTH_STORAGE_KEYS.refreshToken)
  removeStorageItem(AUTH_STORAGE_KEYS.user)
  removeStorageItem(AUTH_STORAGE_KEYS.mustChangePassword)
}

function persistSession(token: string, refreshToken: string, user: AuthUser | null): void {
  setStorageItem(AUTH_STORAGE_KEYS.token, token)
  setStorageItem(AUTH_STORAGE_KEYS.refreshToken, refreshToken)

  if (user) {
    setStorageJson(AUTH_STORAGE_KEYS.user, user)
    return
  }

  removeStorageItem(AUTH_STORAGE_KEYS.user)
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    token: getStorageItem(AUTH_STORAGE_KEYS.token),
    refreshToken: getStorageItem(AUTH_STORAGE_KEYS.refreshToken),
    user: getStorageJson<AuthUser>(AUTH_STORAGE_KEYS.user),
    mustChangePassword: getStorageItem(AUTH_STORAGE_KEYS.mustChangePassword) === 'true',
  }),

  getters: {
    isLoggedIn: (state): boolean => Boolean(state.token),
    isDriver: (state): boolean => state.user?.rol === 'CONDUCTOR',
    fullName: (state): string => state.user?.nombre || '',
    cedula: (state): string => state.user?.cedula || '',
    userId: (state): number => state.user?.id ?? 0,
    placa: (state): string => state.user?.placa || '',
    telefono: (state): string => state.user?.telefono || '',
    ciudad: (state): string => state.user?.ciudad || '',
    soatVigencia: (state): string | null => state.user?.soatVigencia ?? null,
    tecniVigencia: (state): string | null => state.user?.tecniVigencia ?? null,
    enVacaciones: (state): boolean => state.user?.enVacaciones ?? false,
    vacacion: (state): { fechaInicio: string; fechaFin: string } | null => state.user?.vacacion ?? null,
    enAusencia: (state): boolean => state.user?.enAusencia ?? false,
    ausencia: (state): { fecha: string; motivo: string | null } | null => state.user?.ausencia ?? null,
  },

  actions: {
    async login(email: string, password: string): Promise<void> {
      const session = await loginRequest({ email, password })
      this.token = session.access_token
      this.refreshToken = session.refresh_token
      this.user = session.user
      this.mustChangePassword = session.mustChangePassword === true
      if (this.mustChangePassword) {
        setStorageItem(AUTH_STORAGE_KEYS.mustChangePassword, 'true')
      } else {
        removeStorageItem(AUTH_STORAGE_KEYS.mustChangePassword)
      }
      persistSession(this.token, this.refreshToken, this.user)
    },

    logout(): void {
      this.token = ''
      this.refreshToken = ''
      this.user = null
      this.mustChangePassword = false
      clearPersistedSession()
    },

    setTokens(accessToken: string, newRefreshToken: string): void {
      this.token = accessToken
      this.refreshToken = newRefreshToken
      setStorageItem(AUTH_STORAGE_KEYS.token, accessToken)
      setStorageItem(AUTH_STORAGE_KEYS.refreshToken, newRefreshToken)
    },

    setMustChangePassword(value: boolean): void {
      this.mustChangePassword = value
      if (value) {
        setStorageItem(AUTH_STORAGE_KEYS.mustChangePassword, 'true')
      } else {
        removeStorageItem(AUTH_STORAGE_KEYS.mustChangePassword)
      }
    },
  },
})
