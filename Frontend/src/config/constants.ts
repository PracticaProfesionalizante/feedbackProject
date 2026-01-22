/**
 * Configuración centralizada de la aplicación
 * 
 * Las URLs del API están definidas aquí en lugar de variables de entorno
 * porque no son datos sensibles y es más fácil de mantener.
 * 
 * Por defecto usa Render directamente (no requiere backend local).
 */

// Detectar si estamos en producción
const isProduction = import.meta.env.PROD || import.meta.env.MODE === 'production'

// URLs del backend según el entorno
const API_URLS = {
  local: 'http://localhost:3000/api',
  render: 'https://feedback-backend-dhlr.onrender.com/api', // Backend en Render (por defecto)
} as const

/**
 * URL base del API
 * 
 * Por defecto usa Render directamente (no requiere backend local).
 * 
 * Prioridad:
 * 1. VITE_API_BASE_URL (si está definida en .env - para override manual)
 * 2. VITE_USE_LOCAL=true (para usar backend local en desarrollo)
 * 3. Render por defecto (tanto en desarrollo como producción)
 */
const useLocal = import.meta.env.VITE_USE_LOCAL === 'true' || import.meta.env.VITE_USE_LOCAL === '1'

export const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL?.trim() ||
  (useLocal && !isProduction ? API_URLS.local : API_URLS.render)

/**
 * Configuración de la aplicación
 */
export const APP_CONFIG = {
  apiBaseUrl: API_BASE_URL,
  timeout: 10000, // 10 segundos
  isProduction,
  isDevelopment: !isProduction,
} as const

// Exportar también como default para facilitar imports
export default APP_CONFIG
