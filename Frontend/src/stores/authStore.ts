import { defineStore } from 'pinia'

export type Role = 'LEADER' | 'EMPLOYEE'

export type User = {
  id: string
  email: string
  name: string
  role: Role
  createdAt?: string
  updatedAt?: string
}

type LoginPayload = { email: string; password: string }
type RegisterPayload = { name: string; email: string; password: string }

const TOKEN_KEY = 'auth_token'

function decodeJwt(token: string): any | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload = parts[1]
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(json)
  } catch {
    return null
  }
}

function isJwtExpired(token: string): boolean {
  const payload = decodeJwt(token)
  if (!payload?.exp) return false
  const nowSec = Math.floor(Date.now() / 1000)
  return payload.exp <= nowSec
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem(TOKEN_KEY) as string | null,
    user: null as User | null,

    checked: false,
    loading: false,
    error: null as string | null
  }),

  getters: {
    isAuthenticated: (state) => Boolean(state.token),
    isLeader: (state) => state.user?.role === 'LEADER',
    isEmployee: (state) => state.user?.role === 'EMPLOYEE'
  },

  actions: {
    setToken(token: string | null) {
      this.token = token
      if (token) localStorage.setItem(TOKEN_KEY, token)
      else localStorage.removeItem(TOKEN_KEY)
    },

    resetSession() {
      this.setToken(null)
      this.user = null
      this.error = null
      this.checked = true
    },

    getAuthHeader() {
      return this.token ? { Authorization: `Bearer ${this.token}` } : {}
    },

    async fetchMe() {
      if (!this.token) return null
      const API_URL = import.meta.env.VITE_API_URL

      const res = await fetch(`${API_URL}/auth/me`, {
        headers: { ...this.getAuthHeader() }
      })

      if (!res.ok) {
        // token inválido/expirado
        this.resetSession()
        return null
      }

      const data = await res.json()
      // soporta { user: {...} } o directamente {...}
      this.user = data.user ?? data
      return this.user
    },

    /**
     * ✅ Se llama desde el router guard (beforeEach)
     * - Relee token de localStorage
     * - Controla expiración si es JWT
     * - Trae /me si hace falta (o si user es null)
     */
    async checkAuth() {
      const token = localStorage.getItem(TOKEN_KEY)
      this.setToken(token)

      if (!this.token) {
        this.user = null
        this.checked = true
        return false
      }

      if (isJwtExpired(this.token)) {
        this.resetSession()
        return false
      }

      // Si no tengo user, intento hidratar sesión con /me
      try {
        if (!this.user) {
          await this.fetchMe()
        }
        this.checked = true
        return this.isAuthenticated
      } catch {
        // Si se cae el backend, mantenemos token pero marcamos checked
        this.checked = true
        return this.isAuthenticated
      }
    },

    async login(payload: LoginPayload) {
      this.loading = true
      this.error = null
      try {
        const API_URL = import.meta.env.VITE_API_URL

        const res = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })

        if (!res.ok) {
          const msg = await res.text()
          throw new Error(msg || 'Login failed')
        }

        const data = await res.json()
        // soporta: { token, user } o { token }
        this.setToken(data.token)
        this.user = data.user ?? null

        if (!this.user) {
          await this.fetchMe()
        }

        this.checked = true
        return true
      } catch (e: any) {
        this.error = e?.message ?? 'Login error'
        this.resetSession()
        return false
      } finally {
        this.loading = false
      }
    },

    async register(payload: RegisterPayload) {
      this.loading = true
      this.error = null
      try {
        const API_URL = import.meta.env.VITE_API_URL

        const res = await fetch(`${API_URL}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })

        if (!res.ok) {
          const msg = await res.text()
          throw new Error(msg || 'Register failed')
        }

        const data = await res.json()

        // Si register devuelve token, queda logueado
        if (data?.token) {
          this.setToken(data.token)
          this.user = data.user ?? null
          if (!this.user) await this.fetchMe()
        }

        this.checked = true
        return true
      } catch (e: any) {
        this.error = e?.message ?? 'Register error'
        return false
      } finally {
        this.loading = false
      }
    },

    logout() {
      this.resetSession()
    }
  }
})