// Importar constants primero para establecer process.env antes de que Prisma se inicialice
import './config/constants'

import express from 'express'
import cors from 'cors'
import { errorHandler } from './middleware/errorHandler'
import { authRoutes } from './routes/auth.routes'
import teamRoutes from './routes/teamRoutes'
import { userRoutes } from './routes/user.routes'
import feedbackRoutes from './routes/feedbackRoutes'
import { PORT, CORS_ORIGIN } from './config/constants'

const app = express()

// Middlewares
app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true,
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

// Error handler
app.use(errorHandler)

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
  console.log(`📡 CORS enabled for: ${CORS_ORIGIN}`)
})
