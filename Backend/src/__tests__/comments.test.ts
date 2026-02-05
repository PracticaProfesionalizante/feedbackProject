import request from 'supertest'
import { prisma } from '../utils/prisma'
import { app } from '../index'
import { resetDb } from './helpers/db'
import { registerAndLogin } from './helpers/authHelpers'
import { createTestFeedback } from './helpers/feedbackHelpers'
import { createTestComment } from './helpers/commentHelpers'

describe('[Back-17] Comments', () => {
  beforeEach(async () => {
    await resetDb()
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  test('POST /api/comments - crea comentario exitosamente', async () => {
    const tokenA = await registerAndLogin('a@test.com', '12345678', 'User A')
    await registerAndLogin('b@test.com', '12345678', 'User B')

    const a = await prisma.user.findUnique({ where: { email: 'a@test.com' } })
    const b = await prisma.user.findUnique({ where: { email: 'b@test.com' } })
    if (!a || !b) throw new Error('Usuarios no creados')

    const feedback = await createTestFeedback(a.id, b.id)

    const res = await request(app)
      .post('/api/comments')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ feedbackId: feedback.id, content: 'Excelente feedback!' })

    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('id')
    expect(res.body.content).toBe('Excelente feedback!')
    expect(res.body.user).toHaveProperty('id')
  })

  test('POST /api/comments - 404 si feedback no existe', async () => {
    const tokenA = await registerAndLogin('a@test.com', '12345678', 'User A')
  
    const res = await request(app)
      .post('/api/comments')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        feedbackId: '00000000-0000-0000-0000-000000000000',
        content: 'Hola'
      })
  
    expect([400, 404]).toContain(res.status)
  })
  

  test(
    'POST /api/comments - 403 si usuario no tiene acceso al feedback',
    async () => {
      const tokenA = await registerAndLogin('a@test.com', '12345678', 'User A')
      await registerAndLogin('b@test.com', '12345678', 'User B')
  
      const a = await prisma.user.findUnique({ where: { email: 'a@test.com' } })
      const b = await prisma.user.findUnique({ where: { email: 'b@test.com' } })
      if (!a || !b) throw new Error('Usuarios no creados')
  
      // Creamos un tercero pero SOLO lo registramos (no hacemos login acá)
      await request(app).post('/api/auth/register').send({
        email: 'c@test.com',
        password: '12345678',
        name: 'User C',
      })
  
      // y recién acá hacemos login para obtener tokenC (1 login en vez de varios)
      const loginC = await request(app).post('/api/auth/login').send({
        email: 'c@test.com',
        password: '12345678',
      })
      const tokenC = loginC.body?.data?.token
      if (!tokenC) throw new Error(`Login C sin token: ${JSON.stringify(loginC.body)}`)
  
      const feedback = await createTestFeedback(a.id, b.id)
  
      const res = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${tokenC}`)
        .send({ feedbackId: feedback.id, content: 'No tengo acceso' })
  
      expect(res.status).toBe(403)
    },
    90000
  )
  

  test('POST /api/comments - crea notificación al destinatario si comenta otro', async () => {
    const tokenA = await registerAndLogin('a@test.com', '12345678', 'User A')
    await registerAndLogin('b@test.com', '12345678', 'User B')

    const a = await prisma.user.findUnique({ where: { email: 'a@test.com' } })
    const b = await prisma.user.findUnique({ where: { email: 'b@test.com' } })
    if (!a || !b) throw new Error('Usuarios no creados')

    const feedback = await createTestFeedback(a.id, b.id)

    const res = await request(app)
      .post('/api/comments')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ feedbackId: feedback.id, content: 'Te comenté' })

    expect(res.status).toBe(201)

    const notifs = await prisma.notification.count({ where: { userId: b.id } })
    expect(notifs).toBeGreaterThan(0)
  })

  test('GET /api/feedbacks/:feedbackId/comments - lista ordenado asc', async () => {
    const tokenA = await registerAndLogin('a@test.com', '12345678', 'User A')
    await registerAndLogin('b@test.com', '12345678', 'User B')

    const a = await prisma.user.findUnique({ where: { email: 'a@test.com' } })
    const b = await prisma.user.findUnique({ where: { email: 'b@test.com' } })
    if (!a || !b) throw new Error('Usuarios no creados')

    const feedback = await createTestFeedback(a.id, b.id)
    await createTestComment(feedback.id, a.id, 'Primero')
    await new Promise(r => setTimeout(r, 10))
    await createTestComment(feedback.id, a.id, 'Segundo')

    const res = await request(app)
      .get(`/api/feedbacks/${feedback.id}/comments`)
      .set('Authorization', `Bearer ${tokenA}`)

    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.comments)).toBe(true)
    expect(res.body.comments[0].content).toBe('Primero')
    expect(res.body.comments[1].content).toBe('Segundo')
  })

  test('DELETE /api/comments/:id - elimina comentario propio', async () => {
    const tokenA = await registerAndLogin('a@test.com', '12345678', 'User A')
    await registerAndLogin('b@test.com', '12345678', 'User B')

    const a = await prisma.user.findUnique({ where: { email: 'a@test.com' } })
    const b = await prisma.user.findUnique({ where: { email: 'b@test.com' } })
    if (!a || !b) throw new Error('Usuarios no creados')

    const feedback = await createTestFeedback(a.id, b.id)
    const comment = await createTestComment(feedback.id, a.id, 'Borrame')

    const res = await request(app)
      .delete(`/api/comments/${comment.id}`)
      .set('Authorization', `Bearer ${tokenA}`)

    expect(res.status).toBe(204)
    const exists = await prisma.comment.findUnique({ where: { id: comment.id } })
    expect(exists).toBeNull()
  })

  test('DELETE /api/comments/:id - 403 si no es el autor', async () => {
    const tokenA = await registerAndLogin('a@test.com', '12345678', 'User A')
    const tokenB = await registerAndLogin('b@test.com', '12345678', 'User B')

    const a = await prisma.user.findUnique({ where: { email: 'a@test.com' } })
    const b = await prisma.user.findUnique({ where: { email: 'b@test.com' } })
    if (!a || !b) throw new Error('Usuarios no creados')

    const feedback = await createTestFeedback(a.id, b.id)
    const comment = await createTestComment(feedback.id, a.id, 'Solo A borra')

    const res = await request(app)
      .delete(`/api/comments/${comment.id}`)
      .set('Authorization', `Bearer ${tokenB}`)

    expect(res.status).toBe(403)
  })

  test('Cascade delete - al eliminar feedback se eliminan comments', async () => {
    await registerAndLogin('a@test.com', '12345678', 'User A')
    await registerAndLogin('b@test.com', '12345678', 'User B')

    const a = await prisma.user.findUnique({ where: { email: 'a@test.com' } })
    const b = await prisma.user.findUnique({ where: { email: 'b@test.com' } })
    if (!a || !b) throw new Error('Usuarios no creados')

    const feedback = await createTestFeedback(a.id, b.id)
    const comment = await createTestComment(feedback.id, a.id, 'cascade')

    await prisma.feedback.delete({ where: { id: feedback.id } })

    const deleted = await prisma.comment.findUnique({ where: { id: comment.id } })
    expect(deleted).toBeNull()
  })
})
