import { NotificationType } from '@prisma/client';
import { prisma } from '../utils/prisma';

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
}

export const notificationService = new NotificationService();