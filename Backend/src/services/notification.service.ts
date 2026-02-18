import { NotificationType } from '@prisma/client'
import { prisma } from '../utils/prisma'

class NotificationService {
  /** Solo notificamos feedback nuevo. feedbackId permite marcar como leído al abrir ese feedback. */
  async createFeedbackReceivedNotification(
    userId: string,
    fromUserName: string,
    feedbackId: string
  ) {
    return prisma.notification.create({
      data: {
        userId,
        feedbackId,
        type: NotificationType.FEEDBACK_RECEIVED,
        message: `Nuevo feedback de ${fromUserName}`,
      },
    })
  }
}

export const notificationService = new NotificationService();