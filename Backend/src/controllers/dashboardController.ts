import { Request, Response, NextFunction } from 'express'
import { PrismaClient } from '@prisma/client'
import { analyticsService } from '../services/analyticsService'

const prisma = new PrismaClient()

export const getDashboardStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // ID del usuario autenticado (seteado por authenticate middleware)
    const userId = (req as any).userId

    // -----------------------------------
    // FEEDBACKS POR ESTADO (RECIBIDOS)
    // -----------------------------------
    const feedbacksByStatusRaw = await prisma.feedback.groupBy({
      by: ['status'],
      where: { toUserId: userId },
      _count: true
    })

    // -----------------------------------
    // FEEDBACKS POR TIPO (ENVIADOS + RECIBIDOS)
    // -----------------------------------
    const feedbacksByTypeRaw = await prisma.feedback.groupBy({
      by: ['type'],
      where: {
        OR: [
          { toUserId: userId },
          { fromUserId: userId }
        ]
      },
      _count: true
    })

    // -----------------------------------
    // TOTALES
    // -----------------------------------
    const [totalReceived, totalSent] = await Promise.all([
      prisma.feedback.count({ where: { toUserId: userId } }),
      prisma.feedback.count({ where: { fromUserId: userId } })
    ])

    // -----------------------------------
    // NOTIFICACIONES NO LEÍDAS
    // -----------------------------------
    const unreadNotifications = await prisma.notification.count({
      where: { userId, read: false }
    })

    // -----------------------------------
    // NORMALIZAR FEEDBACKS POR ESTADO
    // -----------------------------------
    const feedbacksByStatus = {
      pending: 0,
      inProgress: 0,
      completed: 0
    }

    feedbacksByStatusRaw.forEach(item => {
      if (item.status === 'PENDING') feedbacksByStatus.pending = item._count
      if (item.status === 'IN_PROGRESS') feedbacksByStatus.inProgress = item._count
      if (item.status === 'COMPLETED') feedbacksByStatus.completed = item._count
    })

    // -----------------------------------
    // NORMALIZAR FEEDBACKS POR TIPO
    // -----------------------------------
    const feedbacksByType = {
      recognition: 0,
      improvement: 0,
      general: 0
    }

    feedbacksByTypeRaw.forEach(item => {
      if (item.type === 'RECOGNITION') feedbacksByType.recognition = item._count
      if (item.type === 'IMPROVEMENT') feedbacksByType.improvement = item._count
      if (item.type === 'GENERAL') feedbacksByType.general = item._count
    })

    // -----------------------------------
    // MÉTRICAS AVANZADAS (Back-12)
    // -----------------------------------
    const [
      feedbacksByMonth,
      avgCompletionTime,
      topCollaborators,
      completionRate
    ] = await Promise.all([
      analyticsService.getFeedbacksByMonth(userId),
      analyticsService.getAvgCompletionTime(userId),
      analyticsService.getTopCollaborators(userId),
      analyticsService.getCompletionRate(userId)
    ])

    // -----------------------------------
    // RESPONSE FINAL
    // -----------------------------------
    res.json({
      feedbacksByStatus,
      feedbacksByType,
      totalReceived,
      totalSent,
      unreadNotifications,
      feedbacksByMonth,
      avgCompletionTime,
      topCollaborators,
      completionRate
    })
  } catch (error) {
    next(error)
  }
}
