import { Request, Response, NextFunction } from 'express';
import { PrismaClient, NotificationType } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

// Extender la interfaz Request para incluir el usuario
interface AuthRequest extends Request {
  user?: { id: string; role: string; name: string };
}

export const getComments = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { feedbackId } = req.params;
    
    const comments = await prisma.comment.findMany({
      where: { feedbackId },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    });
    
    res.json({ comments });
  } catch (error) {
    next(error);
  }
};

export const createComment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { feedbackId, content } = req.body;
    const userId = req.user!.id;
    
    // Verificar que el feedback existe
    const feedback = await prisma.feedback.findUnique({
      where: { id: feedbackId }
    });
    
    if (!feedback) {
      throw new AppError('Feedback no encontrado', 404);
    }
    
    const comment = await prisma.comment.create({
      data: {
        feedbackId,
        userId,
        content
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });
    
    // Crear notificación para el owner del feedback si no es el mismo que comenta
    if (feedback.toUserId !== userId) {
      await prisma.notification.create({
        data: {
          userId: feedback.toUserId,
          type: NotificationType.COMMENT_RECEIVED,
          message: `${req.user!.name} comentó en tu feedback`
        }
      });
    }
    
    res.status(201).json(comment);
  } catch (error) {
    next(error);
  }
};

export const deleteComment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    
    const comment = await prisma.comment.findUnique({
      where: { id }
    });
    
    if (!comment) {
      throw new AppError('Comentario no encontrado', 404);
    }
    
    // Solo el autor puede eliminar
    if (comment.userId !== userId) {
      throw new AppError('Solo el autor puede eliminar el comentario', 403);
    }
    
    await prisma.comment.delete({ where: { id } });
    
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
