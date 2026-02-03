import { Request, Response, NextFunction } from 'express';
import { feedbackService } from '../services/feedback.service';
import { FeedbackStatus } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';
import { prisma } from '../utils/prisma';
import { notificationService } from '../services/notification.service'; // Importar el nuevo servicio

export const createFeedback = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id; // Asumimos authMiddleware
    const feedback = await feedbackService.create(userId, req.body);
    
    // Crear notificación para el destinatario (toUser)
    await notificationService.createFeedbackReceivedNotification(
      feedback.toUserId,
      (req as any).user.name // El nombre del usuario que envía el feedback
    );

    res.status(201).json(feedback);
  } catch (error) {
    next(error);
  }
};

export const getFeedbacks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const result = await feedbackService.findAll(userId, req.query);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getRecentFeedbacks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const limit = Math.min(Number(req.query.limit) || 10, 50);

    const feedbacks = await prisma.feedback.findMany({
      where: {
        OR: [
          { toUserId: userId },
          { fromUserId: userId }
        ]
      },
      include: {
        fromUser: {
          select: { id: true, name: true, email: true }
        },
        toUser: {
          select: { id: true, name: true, email: true }
        },
        _count: {
          select: { comments: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    res.json({ feedbacks });
  } catch (error) {
    next(error);
  }
};

export const getFeedbackById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const feedback = await feedbackService.findOne(userId, req.params.id);
    res.json(feedback);
  } catch (error) {
    next(error);
  }
};

export const updateFeedback = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const feedback = await feedbackService.update(userId, req.params.id, req.body);
    res.json(feedback);
  } catch (error) {
    next(error);
  }
};

export const updateStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = (req as any).user.id;

    // Buscar el feedback
    const feedback = await prisma.feedback.findUnique({
      where: { id }
    });

    if (!feedback) {
      throw new AppError('Feedback no encontrado', 404);
    }

    // Validar permisos: Solo el destinatario puede cambiar el estado
    if (feedback.toUserId !== userId) {
      throw new AppError('Solo el destinatario puede cambiar el estado', 403);
    }

    // Validar transiciones de estado
    const currentStatus = feedback.status;
    const newStatus = status as FeedbackStatus;

    // COMPLETED → cualquier otro ❌ (no permitido)
    if (currentStatus === FeedbackStatus.COMPLETED) {
      throw new AppError('No se puede cambiar el estado de un feedback completado', 400);
    }

    // IN_PROGRESS → PENDING ❌ (no permitido)
    if (currentStatus === FeedbackStatus.IN_PROGRESS && newStatus === FeedbackStatus.PENDING) {
      throw new AppError('No se puede retroceder de IN_PROGRESS a PENDING', 400);
    }

    // Validar transiciones válidas:
    // PENDING → IN_PROGRESS ✅
    // PENDING → COMPLETED ✅
    // IN_PROGRESS → COMPLETED ✅
    const validTransitions: Record<FeedbackStatus, FeedbackStatus[]> = {
      [FeedbackStatus.PENDING]: [FeedbackStatus.IN_PROGRESS, FeedbackStatus.COMPLETED],
      [FeedbackStatus.IN_PROGRESS]: [FeedbackStatus.COMPLETED],
      [FeedbackStatus.COMPLETED]: [], // Ya validado arriba
    };

    if (!validTransitions[currentStatus].includes(newStatus)) {
      throw new AppError(
        `Transición inválida: No se puede cambiar de ${currentStatus} a ${newStatus}`,
        400
      );
    }

    // Actualizar el feedback
    const updated = await prisma.feedback.update({
      where: { id },
      data: { status: newStatus },
      include: {
        fromUser: { select: { id: true, name: true } },
        toUser: { select: { id: true, name: true } }
      }
    });

    // Crear notificación para el autor
    await notificationService.createFeedbackUpdatedNotification(
      feedback.fromUserId,
      newStatus
    );

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

export const deleteFeedback = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    await feedbackService.delete(userId, req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};