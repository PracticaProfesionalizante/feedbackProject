import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { errorHandler } from './middleware/errorHandler'
import { authRoutes } from './routes/auth.routes'
import userRoutes from "./routes/user.routes" // ✅ Importación correcta
import notificationRoutes from './routes/notification.routes';
import feedbackRoutes from './routes/feedback.routes';

// Cargar variables de entorno
dotenv.config()

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

// Rutas de la API
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes) // ✅ AQUÍ es el lugar correcto
app.use('/api/notifications', notificationRoutes); // ✅ Nueva ruta para notificaciones
app.use('/api/feedbacks', feedbackRoutes); // ✅ Nueva ruta para feedbacks

// Error handler (Siempre va después de las rutas)
app.use(errorHandler)

// 👇 CAMBIA ESTO AL FINAL:
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
})

// Exportamos 'app' y 'server' para los tests
export { app, server }