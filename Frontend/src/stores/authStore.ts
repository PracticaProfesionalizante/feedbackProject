import { defineStore } from 'pinia'

/* =========================
   Tipos
========================= */

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

/* =========================
   Constantes
========================= */

const TOKEN_KEY = 'auth_token'
const USER_KEY = 'auth_user'
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'

/* =========================
   Helpers JWT
========================= */

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

/* =========================
   Store
========================= */

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem(TOKEN_KEY) as string | null,

    user: (() => {
      const raw = localStorage.getItem(USER_KEY)
      if (!raw) return null
      try {
        return JSON.parse(raw) as User
      } catch {
        return null
      }
    })(),

    checked: false,
    loading: false,
    error: null as string | null,
  }),

  getters: {
    isAuthenticated: (state) => Boolean(state.token),
    isLeader: (state) => state.user?.role === 'LEADER',
    isEmployee: (state) => state.user?.role === 'EMPLOYEE',
  },

  actions: {
    /* =========================
       Helpers de sesión
    ========================= */

    setToken(token: string | null) {
      this.token = token
      if (token) localStorage.setItem(TOKEN_KEY, token)
      else localStorage.removeItem(TOKEN_KEY)
    },

    setUser(user: User | null) {
      this.user = user
      if (user) localStorage.setItem(USER_KEY, JSON.stringify(user))
      else localStorage.removeItem(USER_KEY)
    },

    resetSession() {
      this.setToken(null)
      this.setUser(null)
      this.error = null
      this.checked = true
    },

    logout() {
      this.resetSession()
    },

    getAuthHeader(): Record<string, string> {
      return this.token ? { Authorization: `Bearer ${this.token}` } : {}
    },

    /* =========================
       API calls
    ========================= */

    async fetchMe() {
      if (!this.token) return null

      try {
        const res = await fetch(`${API_BASE}/auth/me`, {
          headers: this.getAuthHeader(),
        })

        if (res.status === 401) {
          this.resetSession()
          return null
        }

        if (!res.ok) {
          this.error = await res.text()
          return this.user
        }

        const data = await res.json()
        const user = (data?.user ?? data) as User
        this.setUser(user)
        return user
      } catch (e: any) {
        this.error = e?.message ?? null
        return this.user
      }
    },

    /**
     * Se llama desde router guard (beforeEach)
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

      try {
        if (!this.user) {
          await this.fetchMe()
        }
        this.checked = true
        return this.isAuthenticated
      } catch {
        this.checked = true
        return this.isAuthenticated
      }
    },

    async login(payload: LoginPayload = { email: '', password: '' }) {
      this.loading = true
      this.error = null

      try {
        if (!payload?.email || !payload?.password) {
          throw new Error('Faltan credenciales')
        }

        const res = await fetch(`${API_BASE}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        if (!res.ok) {
          const msg = await res.text()
          throw new Error(msg || 'Login failed')
        }

        const raw = await res.json()
        const data = raw?.data ?? raw

        const token: string | undefined = data?.token
        const user: User | null = data?.user ?? null

        if (!token) {
          throw new Error('Respuesta inválida: no se recibió token')
        }

        this.setToken(token)
        this.setUser(user)

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
        const res = await fetch(`${API_BASE}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        if (!res.ok) {
          const msg = await res.text()
          throw new Error(msg || 'Register failed')
        }

        const raw = await res.json()
        const data = raw?.data ?? raw

        const token: string | undefined = data?.token
        const user: User | null = data?.user ?? null

        if (token) {
          this.setToken(token)
          this.setUser(user)
          if (!this.user) await this.fetchMe()
          this.checked = true
          return true
        }

        const ok = await this.login({
          email: payload.email,
          password: payload.password,
        })

        this.checked = true
        return ok
      } catch (e: any) {
        this.error = e?.message ?? 'Register error'
        return false
      } finally {
        this.loading = false
      }
    },
  },
})
