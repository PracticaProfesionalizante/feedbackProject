import request from 'supertest'
import { app, server } from '../index'
import { prisma } from '../utils/prisma'

jest.setTimeout(30000)

// Cerramos la conexión y el servidor al terminar todos los tests
afterAll(async () => {
  await prisma.$disconnect()
  server?.close?.()
})

describe('🔐 Auth API Tests', () => {
  const uniqueEmail = `test_${Date.now()}@example.com`
  const userData = {
    email: uniqueEmail,
    name: 'Test User',
    password: 'password123',
  }

  let token = ''

  describe('POST /api/auth/register', () => {
    test('✅ Debe registrar usuario exitosamente', async () => {
      const response = await request(app).post('/api/auth/register').send(userData)

      expect(response.status).toBe(201)
      expect(response.body).toHaveProperty('success', true)
      expect(response.body).toHaveProperty('data.email', userData.email)
      expect(response.body.data).not.toHaveProperty('password')
      
    })

    test('❌ Debe fallar con email duplicado', async () => {
      const response = await request(app).post('/api/auth/register').send(userData)
      expect([400, 409]).toContain(response.status)

    })
  })

  describe('POST /api/auth/login', () => {
    test('✅ Debe hacer login exitosamente', async () => {
      const response = await request(app).post('/api/auth/login').send({
        email: userData.email,
        password: userData.password,
      })

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('data.token')
      token = response.body.data.token
      
    })

    test('❌ Debe fallar con credenciales incorrectas', async () => {
      const response = await request(app).post('/api/auth/login').send({
        email: userData.email,
        password: 'wrongpassword',
      })

      expect([400, 401]).toContain(response.status)
    })
  })

  describe('GET /api/users/profile', () => {
    test('❌ Debe fallar sin token', async () => {
      const response = await request(app).get('/api/users/profile')
      expect(response.status).toBe(401)
    })

    test('✅ Debe obtener perfil con token válido', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${token}`)

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('user.email', userData.email)

    })
  })
})
