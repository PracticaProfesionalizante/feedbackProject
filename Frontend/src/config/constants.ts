/**
 * Configuración centralizada de la aplicación
 *
 * Por defecto todas las peticiones van al backend en Render.
 * Override con VITE_API_BASE_URL en .env si necesitas otro backend.
 */

// Detectar si estamos en producción
const isProduction = import.meta.env.PROD || import.meta.env.MODE === 'production'

const RENDER_API = 'https://feedback-backend-dhlr.onrender.com/api'

/**
 * URL base del API. Por defecto: backend en Render.
 */
export const API_BASE_URL: string =
  (import.meta.env.VITE_API_BASE_URL?.trim()) || RENDER_API

/**
 * Configuración de la aplicación
 */
export const APP_CONFIG = {
  apiBaseUrl: API_BASE_URL,
  timeout: 30000, // 30 segundos (Render puede tener cold start)
  isProduction,
  isDevelopment: !isProduction,
} as const

// Exportar también como default para facilitar imports
export default APP_CONFIG
