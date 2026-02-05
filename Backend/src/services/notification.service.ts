import { PrismaClient, NotificationType, FeedbackStatus } from '@prisma/client';

const prisma = new PrismaClient();

class NotificationService {
  async createFeedbackReceivedNotification(
    userId: string,
    fromUserName: string
  ) {
    return prisma.notification.create({
      data: {
        userId,
        type: NotificationType.FEEDBACK_RECEIVED,
        message: `Nuevo feedback de ${fromUserName}`
      }
    });
  }
  
  async createCommentReceivedNotification(
    userId: string,
    commenterName: string
  ) {
    return prisma.notification.create({
      data: {
        userId,
        type: NotificationType.COMMENT_RECEIVED,
        message: `${commenterName} comentó en tu feedback`
      }
    });
  }
  
  async createFeedbackUpdatedNotification(
    userId: string,
    newStatus: FeedbackStatus // Usar el enum de Prisma para el estado
  ) {
    const statusMessages: Record<FeedbackStatus, string> = {
      [FeedbackStatus.PENDING]: 'pendiente',
      [FeedbackStatus.IN_PROGRESS]: 'en proceso',
      [FeedbackStatus.COMPLETED]: 'completado',
    };

    return prisma.notification.create({
      data: {
        userId,
        type: NotificationType.FEEDBACK_UPDATED,
        message: `Tu feedback cambió a estado ${statusMessages[newStatus]}`
      }
    });
  }
}

export const notificationService = new NotificationService();