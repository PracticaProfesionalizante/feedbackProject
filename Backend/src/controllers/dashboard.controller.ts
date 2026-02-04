import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';

export const getDashboardStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    // Lógica para obtener estadísticas del dashboard
    // Esto es un placeholder, se puede expandir según las necesidades
    const totalFeedbacks = await prisma.feedback.count({
      where: {
        OR: [
          { fromUserId: userId },
          { toUserId: userId }
        ]
      }
    });

    const pendingFeedbacks = await prisma.feedback.count({
      where: {
        toUserId: userId,
        status: 'PENDING'
      }
    });

    const unreadNotifications = await prisma.notification.count({
      where: {
        userId,
        read: false
      }
    });

    res.json({
      totalFeedbacks,
      pendingFeedbacks,
      unreadNotifications
    });
  } catch (error) {
    next(error);
  }
};
