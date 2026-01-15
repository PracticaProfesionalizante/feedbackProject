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
const USER_KEY = 'auth_user'
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'

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

    getAuthHeader(): Record<string, string> {
      return this.token ? { Authorization: `Bearer ${this.token}` } : {}
    },

    async fetchMe() {
      if (!this.token) return null

      try {
        const res = await fetch(`${API_BASE}/auth/me`, {
          headers: { ...this.getAuthHeader() }
        })

        if (res.status === 401) {
          this.resetSession()
          return null
        }

        if (!res.ok) {
          // Ante 500/503 u otros errores mantenemos sesión
          this.error = await res.text()
          return this.user
        }

        const data = await res.json()
        const user = (data?.user ?? data) as User
        this.setUser(user)
        return user
      } catch (e: any) {
        // Caídas de red/backend: mantenemos sesión y devolvemos user actual
        this.error = e?.message ?? null
        return this.user
      }
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
        const res = await fetch(`${API_BASE}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })

        if (!res.ok) {
          const msg = await res.text()
          throw new Error(msg || 'Login failed')
        }

        const raw = await res.json()

        // ✅ Backend puede devolver { token, user } o { data: { token, user } }
        const responseData = raw?.data ?? raw
        const token: string | undefined = responseData?.token
        const user: User | null = responseData?.user ?? null

        if (!token) {
          throw new Error('Respuesta inválida: no se recibió token')
        }

        this.setToken(token)
        this.setUser(user)

        // Si no vino user, intentamos hidratarlo
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
      body: JSON.stringify(payload)
    })

    if (!res.ok) {
      const msg = await res.text()
      throw new Error(msg || 'Register failed')
    }

    const raw = await res.json()
    const responseData = raw?.data ?? raw

    // ✅ Si register devuelve token, queda logueado
    const token: string | undefined = responseData?.token
    const user: User | null = responseData?.user ?? null

    if (token) {
      this.setToken(token)
      this.setUser(user)
      if (!this.user) await this.fetchMe()
      this.checked = true
      return true
    }

    // ✅ Si NO devuelve token, hacemos auto-login con credenciales
    const ok = await this.login({ email: payload.email, password: payload.password })
    this.checked = true
    return ok
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
