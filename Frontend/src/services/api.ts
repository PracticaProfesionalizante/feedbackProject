import axios from 'axios'
import type { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios'
import { useAuthStore } from '../stores/authStore' // ajustá el path si tu store está en otro lado

// Configuración base de Axios
const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor de solicitudes (agrega JWT)
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 1) Preferimos token desde Pinia
    let token: string | null | undefined
    try {
      const authStore = useAuthStore()
      token = authStore.token
    } catch {
      // Si el store no está disponible por el contexto (muy raro), caemos a localStorage
      token = undefined
    }

    // 2) Fallback: token desde localStorage (útil si recargan la página)
    if (!token) {
      token = localStorage.getItem('auth_token')
    }

    // 3) Set header Authorization
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    } else {
      // Evita mandar un header viejo si quedó seteado por alguna razón
      delete (config.headers as any).Authorization
    }

    return config
  },
  (error) => Promise.reject(error)
)

// Interceptor de respuestas (manejo global)
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    const status = error?.response?.status

    // Si el token expiró o es inválido
   if (status === 401) {
  const hadToken =
    Boolean(localStorage.getItem('auth_token')) ||
    Boolean((error.config?.headers as any)?.Authorization)

  const isAuthEndpoint =
    typeof error.config?.url === 'string' &&
    (error.config.url.includes('/auth/login') || error.config.url.includes('/auth/register'))

  if (hadToken && !isAuthEndpoint) {
    try {
      const authStore = useAuthStore()
      authStore.logout()
    } catch {
      localStorage.removeItem('auth_token')
    }
  }
}

    // Logs actuales (los dejo)
    if (error.response) {
      console.error('Error de respuesta:', error.response.data)
    } else if (error.request) {
      console.error('Error de solicitud:', error.request)
    } else {
      console.error('Error:', error.message)
    }

    return Promise.reject(error)
  }
)

export default apiClient
