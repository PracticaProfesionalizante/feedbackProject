/**
 * Configuración centralizada del backend
 * 
 * Todas las configuraciones están aquí en lugar de variables de entorno
 * para facilitar el mantenimiento y evitar archivos .env
 */

// Detectar entorno (por defecto development si no está definido)
const isDevelopment = !process.env.NODE_ENV || process.env.NODE_ENV === 'development'
const isProduction = !isDevelopment

/**
 * Configuración de la base de datos (Supabase)
 */
export const DATABASE_CONFIG = {
  // Supabase (runtime con pooler / pgbouncer)
  DATABASE_URL: 'postgresql://postgres.fpxxzvimzjiybnzeaaea:hOLaTeclab2025@aws-0-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1',
  
  // Supabase (direct, para Prisma db pull / migraciones)
  DIRECT_URL: 'postgresql://postgres.fpxxzvimzjiybnzeaaea:hOLaTeclab2025@aws-0-us-west-2.pooler.supabase.com:5432/postgres',
} as const

/**
 * Configuración de JWT
 */
export const JWT_CONFIG = {
  SECRET: 'your-super-secret-jwt-key',
  EXPIRES_IN: '7d',
} as const

/**
 * Configuración del servidor
 */
export const SERVER_CONFIG = {
  PORT: 3000,
  NODE_ENV: isDevelopment ? 'development' : 'production',
  // CORS: Permitir múltiples orígenes (desarrollo local y producción)
  CORS_ORIGINS: [
    'http://localhost:5173', // Frontend local (Vite default)
    'http://localhost:3000', // Por si acaso
    'http://127.0.0.1:5173', // Alternativa localhost
    // Agregar aquí tu dominio de producción cuando lo tengas
    // 'https://tu-app.vercel.app',
  ],
} as const

/**
 * Configuración completa de la aplicación
 */
export const APP_CONFIG = {
  database: DATABASE_CONFIG,
  jwt: JWT_CONFIG,
  server: SERVER_CONFIG,
  isDevelopment,
  isProduction,
} as const

/**
 * Establecer variables de entorno para Prisma y compatibilidad
 * Esto se ejecuta antes de que Prisma se inicialice
 */
export function setupEnvironment() {
  // Establecer variables para Prisma (necesita process.env)
  process.env.DATABASE_URL = DATABASE_CONFIG.DATABASE_URL
  process.env.DIRECT_URL = DATABASE_CONFIG.DIRECT_URL
  
  // Establecer otras variables para compatibilidad
  process.env.JWT_SECRET = JWT_CONFIG.SECRET
  process.env.JWT_EXPIRES_IN = JWT_CONFIG.EXPIRES_IN
  process.env.PORT = String(SERVER_CONFIG.PORT)
  process.env.NODE_ENV = SERVER_CONFIG.NODE_ENV
  // CORS se maneja como array, no como string única
}

// Ejecutar setup automáticamente al importar este módulo
setupEnvironment()

// Exportar también valores individuales para uso directo
export const DATABASE_URL = DATABASE_CONFIG.DATABASE_URL
export const DIRECT_URL = DATABASE_CONFIG.DIRECT_URL
export const JWT_SECRET = JWT_CONFIG.SECRET
export const JWT_EXPIRES_IN = JWT_CONFIG.EXPIRES_IN
export const PORT = SERVER_CONFIG.PORT
export const NODE_ENV = SERVER_CONFIG.NODE_ENV
export const CORS_ORIGINS = SERVER_CONFIG.CORS_ORIGINS
export { isDevelopment, isProduction }

export default APP_CONFIG
