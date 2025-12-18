import axios from 'axios'
import type { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios'

// Configuración base de Axios
const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor de solicitudes
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Aquí puedes agregar tokens de autenticación, etc.
    // const token = localStorage.getItem('token')
    // if (token && config.headers) {
    //   config.headers.Authorization = `Bearer ${token}`
    // }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Interceptor de respuestas
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response
  },
  (error) => {
    // Manejo de errores global
    if (error.response) {
      // El servidor respondió con un código de estado fuera del rango 2xx
      console.error('Error de respuesta:', error.response.data)
    } else if (error.request) {
      // La solicitud se hizo pero no se recibió respuesta
      console.error('Error de solicitud:', error.request)
    } else {
      // Algo más causó el error
      console.error('Error:', error.message)
    }
    return Promise.reject(error)
  }
)

export default apiClient

