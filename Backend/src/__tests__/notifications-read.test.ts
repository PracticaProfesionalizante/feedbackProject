import request from 'supertest'
import { app } from '../index'
import { prisma } from '../utils/prisma'
import { resetDb } from './helpers/db'
import { registerAndLogin } from './helpers/authHelpers'
import { NotificationType } from '@prisma/client'

describe('[Back-26] Notifications Read', () => {
  beforeEach(async () => {
    await resetDb()
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  test('PATCH /api/notifications/:id/read - marca una notificación propia', async () => {
    const tokenA = await registerAndLogin('a@test.com', '12345678', 'User A')
    const userA = await prisma.user.findUnique({ where: { email: 'a@test.com' } })
    if (!userA) throw new Error('User A no creado')

    const notif = await prisma.notification.create({
      data: {
        userId: userA.id,
        type: NotificationType.COMMENT_RECEIVED,
        message: 'Te comentaron',
        read: false,
      },
    })

    const res = await request(app)
      .patch(`/api/notifications/${notif.id}/read`)
      .set('Authorization', `Bearer ${tokenA}`)

    expect(res.status).toBe(204)

    const updated = await prisma.notification.findUnique({ where: { id: notif.id } })
    expect(updated?.read).toBe(true)
  })

  test('PATCH /api/notifications/:id/read - no permite marcar notificación de otro usuario', async () => {
    const tokenA = await registerAndLogin('a@test.com', '12345678', 'User A')
    await registerAndLogin('b@test.com', '12345678', 'User B')

    const userB = await prisma.user.findUnique({ where: { email: 'b@test.com' } })
    if (!userB) throw new Error('User B no creado')

    const notifB = await prisma.notification.create({
      data: {
        userId: userB.id,
        type: NotificationType.FEEDBACK_RECEIVED,
        message: 'Nuevo feedback',
        read: false,
      },
    })

    const res = await request(app)
      .patch(`/api/notifications/${notifB.id}/read`)
      .set('Authorization', `Bearer ${tokenA}`)

    // tu controller usa updateMany(id + userId) y si no actualiza => 404
    expect(res.status).toBe(404)
  })

  test('PATCH /api/notifications/read-all - marca todas como leídas', async () => {
    const tokenA = await registerAndLogin('a@test.com', '12345678', 'User A')
    const userA = await prisma.user.findUnique({ where: { email: 'a@test.com' } })
    if (!userA) throw new Error('User A no creado')

    await prisma.notification.createMany({
      data: [
        { userId: userA.id, type: NotificationType.COMMENT_RECEIVED, message: 'n1', read: false },
        { userId: userA.id, type: NotificationType.FEEDBACK_RECEIVED, message: 'n2', read: false },
      ],
    })

    const res = await request(app)
      .patch('/api/notifications/read-all')
      .set('Authorization', `Bearer ${tokenA}`)

    expect(res.status).toBe(204)

    const unreadCount = await prisma.notification.count({
      where: { userId: userA.id, read: false },
    })
    expect(unreadCount).toBe(0)
  })
})
