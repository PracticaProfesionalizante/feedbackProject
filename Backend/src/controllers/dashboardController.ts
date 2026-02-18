import type { Request, Response } from 'express'
import { prisma } from '../utils/prisma'

export const dashboardController = {
  async getStats(req: Request, res: Response) {
    const userId = req.user!.id

    const [totalReceived, totalSent, unreadNotifications] = await Promise.all([
      prisma.feedback.count({ where: { toUserId: userId, deletedAt: null } }),
      prisma.feedback.count({ where: { fromUserId: userId, deletedAt: null } }),
      prisma.notification.count({ where: { userId, read: false } }),
    ])

    return res.json({
      totalReceived,
      totalSent,
      unreadNotifications,
    })
  },
}
