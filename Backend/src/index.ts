// Importar constants primero para establecer process.env antes de que Prisma se inicialice
import './config/constants'

import express from 'express'
import cors from 'cors'
import { errorHandler } from './middleware/error.handler'
import { authRoutes } from './routes/authRoutes'
import teamRoutes from './routes/teamRoutes'
import { userRoutes } from './routes/userRoutes'
import feedbackRoutes from './routes/feedbackRoutes'
import dashboardRoutes from './routes/dashboardRoutes'
import commentRoutes from './routes/commentRoutes'
import notificationRoutes from './routes/notificationRoutes'
import { orgChartRoutes } from './routes/orgChartRoutes'
import { rolesRoutes } from './routes/rolesRoutes'
import { PORT, CORS_ORIGINS, isDevelopment } from './config/constants'

export const app = express()

// Middlewares
app.use(cors({
  origin: (origin, callback) => {
    // Permitir requests sin origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true)
    
    // Permitir localhost siempre (para desarrollo local con backend en Render)
    const isLocalhost = origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')
    
    // Permitir si está en la lista, es localhost, o es desarrollo
    // Usar type assertion para evitar error de tipos con CORS_ORIGINS (as const)
    if ((CORS_ORIGINS as readonly string[]).includes(origin) || isLocalhost || isDevelopment) {
      callback(null, true)
    } else {
      console.warn(`CORS bloqueado para origen: ${origin}`)
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' })
})

// Diagnóstico: comprobar si la DB responde (sin auth)
app.get('/health/db', async (req, res) => {
  try {
    const { prisma } = await import('./utils/prisma')
    await prisma.$queryRaw`SELECT 1`
    res.json({ status: 'ok', db: 'connected' })
  } catch (e) {
    console.error('[health/db]', e)
    res.status(503).json({ status: 'error', db: 'disconnected', message: (e as Error).message })
  }
})

app.use('/api/team', teamRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/feedbacks', feedbackRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api', commentRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/org-chart', orgChartRoutes)
app.use('/api/roles', rolesRoutes)

// Error handler (Siempre va después de las rutas)
app.use(errorHandler)

// export server
export const server =
  process.env.NODE_ENV === 'test'
    ? null
    : app.listen(PORT, () => {})
