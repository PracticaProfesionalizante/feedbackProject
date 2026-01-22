import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { errorHandler } from './middleware/errorHandler'
import { authRoutes } from './routes/auth.routes'
import teamRoutes from './routes/teamRoutes'
import { userRoutes } from './routes/user.routes'
import feedbackRoutes from './routes/feedbackRoutes'
import dashboardRoutes from './routes/dashboardRoutes'





// Cargar variables de entorno desde la raíz del proyecto Backend
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const app = express()
const PORT = process.env.PORT || 3000

// Middlewares
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
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
app.use('/api/dashboard', dashboardRoutes)

// Error handler
app.use(errorHandler)

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
})
