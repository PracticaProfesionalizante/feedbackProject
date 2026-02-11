import type { Request, Response, NextFunction } from 'express'
import { prisma } from '../utils/prisma'
import { AppError } from '../middleware/error.handler'
import { auditLog } from '../services/audit.service'

// GET /api/notifications?read=true|false&limit=50
export const getNotifications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id
    const { read, limit = '50' } = req.query

    const where: any = {
      userId,
      ...(read !== undefined ? { read: read === 'true' } : {}),
    }

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: Number(limit),
      }),
      prisma.notification.count({ where: { userId, read: false } }),
    ])

    res.json({ notifications, unreadCount })
  } catch (error) {
    next(error)
  }
}

// GET /api/notifications/count
export const getUnreadCount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id
    const unreadCount = await prisma.notification.count({
      where: { userId, read: false },
    })
    res.json({ unreadCount })
  } catch (error) {
    next(error)
  }
}

// PATCH /api/notifications/:id/read
export const markNotificationAsRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id
    const { id } = req.params

    const before = await prisma.notification.findFirst({ where: { id, userId }, select: { read: true } })
    const updated = await prisma.notification.updateMany({
      where: { id, userId },
      data: { read: true },
    })

    if (updated.count === 0) throw new AppError('Notificación no encontrada', 404)

    if (before && !before.read) {
      await auditLog(req, {
        tableName: 'Notification',
        recordId: id,
        action: 'UPDATE',
        oldData: { read: false },
        newData: { read: true },
      })
    }

    res.status(204).send()
  } catch (error) {
    next(error)
  }
}

// PATCH /api/notifications/read-all
export const markAllNotificationsAsRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id

    const updated = await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    })

    if (updated.count > 0) {
      await auditLog(req, {
        tableName: 'Notification',
        recordId: `bulk-${userId}-${Date.now()}`,
        action: 'UPDATE',
        newData: { read: true, count: updated.count },
      })
    }

    res.status(204).send()
  } catch (error) {
    next(error)
  }
}
