// Importar constants primero para establecer process.env antes de que Prisma se inicialice
import './config/constants'

import express from 'express'
import cors from 'cors'
import { errorHandler } from './middleware/errorHandler'
import { authRoutes } from './routes/auth.routes'
import teamRoutes from './routes/teamRoutes'
import { userRoutes } from './routes/user.routes'
import feedbackRoutes from './routes/feedbackRoutes'
import dashboardRoutes from './routes/dashboardRoutes'
import { PORT, CORS_ORIGINS, isDevelopment } from './config/constants'

const app = express()

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

app.use('/api/team', teamRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/feedbacks', feedbackRoutes)
app.use('/api/dashboard', dashboardRoutes)

// Error handler
app.use(errorHandler)

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
  console.log(`📡 CORS enabled for: ${CORS_ORIGINS.join(', ')}`)
})
