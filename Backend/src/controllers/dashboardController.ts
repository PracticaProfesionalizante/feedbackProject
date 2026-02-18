import type { Request, Response, NextFunction } from 'express'
import { prisma } from '../utils/prisma'

export const dashboardController = {
  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
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
    } catch (error) {
      console.error('[dashboardController.getStats]', error)
      next(error)
    }
  },
}
