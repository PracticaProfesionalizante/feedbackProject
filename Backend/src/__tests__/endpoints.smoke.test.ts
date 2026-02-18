/**
 * Mini test interno: verifica que los endpoints principales respondan.
 * Ejecutar: npm test -- endpoints.smoke
 */
import request from 'supertest'
import { app, server } from '../index'
import { prisma } from '../utils/prisma'
import { registerAndLogin } from './helpers/authHelpers'

jest.setTimeout(20000)

afterAll(async () => {
  await prisma.$disconnect()
  server?.close?.()
})

describe('Endpoints smoke', () => {
  let token: string

  beforeAll(async () => {
    const email = `smoke_${Date.now()}@test.com`
    token = await registerAndLogin(email, 'pass123', 'Smoke User')
  })

  test('GET /health', async () => {
    const res = await request(app).get('/health')
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('status', 'ok')
  })

  test('GET /api/users/profile', async () => {
    const res = await request(app)
      .get('/api/users/profile')
      .set('Authorization', `Bearer ${token}`)
    expect([200, 401]).toContain(res.status)
    if (res.status === 200) expect(res.body).toHaveProperty('user')
  })

  test('GET /api/feedbacks', async () => {
    const res = await request(app)
      .get('/api/feedbacks')
      .set('Authorization', `Bearer ${token}`)
    expect([200, 401]).toContain(res.status)
    if (res.status === 200) expect(res.body).toHaveProperty('items')
  })

  test('GET /api/dashboard/stats', async () => {
    const res = await request(app)
      .get('/api/dashboard/stats')
      .set('Authorization', `Bearer ${token}`)
    expect([200, 401]).toContain(res.status)
    if (res.status === 200) expect(res.body).toHaveProperty('totalReceived')
  })

  test('GET /api/notifications/count', async () => {
    const res = await request(app)
      .get('/api/notifications/count')
      .set('Authorization', `Bearer ${token}`)
    expect([200, 401]).toContain(res.status)
    if (res.status === 200) expect(res.body).toHaveProperty('unreadCount')
  })

  test('GET /api/team/leaders', async () => {
    const res = await request(app)
      .get('/api/team/leaders')
      .set('Authorization', `Bearer ${token}`)
    expect([200, 401, 403]).toContain(res.status)
    if (res.status === 200) expect(res.body).toHaveProperty('leaders')
  })
})
