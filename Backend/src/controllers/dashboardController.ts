import type { Request, Response } from 'express'
import { prisma } from '../utils/prisma'


function mapTypeCounts(rows: Array<{ type: string; _count: { _all: number } }>) {
  const base = { recognition: 0, improvement: 0, general: 0 }

  for (const r of rows) {
    if (r.type === 'RECOGNITION') base.recognition = r._count._all
    if (r.type === 'IMPROVEMENT') base.improvement = r._count._all
    if (r.type === 'GENERAL') base.general = r._count._all
  }

  return base
}

export const dashboardController = {
  async getStats(req: Request, res: Response) {
    const userId = req.user!.id

    const [byTypeRaw, totalReceived, totalSent, unreadNotifications] =
      await Promise.all([
        prisma.feedback.groupBy({
          by: ['type'],
          where: {
            deletedAt: null,
            OR: [{ toUserId: userId }, { fromUserId: userId }],
          },
          _count: { _all: true },
        }),
        prisma.feedback.count({ where: { toUserId: userId, deletedAt: null } }),
        prisma.feedback.count({ where: { fromUserId: userId, deletedAt: null } }),
        prisma.notification.count({ where: { userId, read: false } }),
      ])

    const feedbacksByType = mapTypeCounts(byTypeRaw as any)

    return res.json({
      feedbacksByType,
      totalReceived,
      totalSent,
      unreadNotifications,
    })
  },
}
