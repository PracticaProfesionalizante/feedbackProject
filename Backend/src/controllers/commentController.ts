import { Request, Response, NextFunction } from 'express'
import { AppError } from '../middleware/error.handler'
import { prisma } from '../utils/prisma'
import { auditLog } from '../services/audit.service'


function paramStr(p: string | string[] | undefined): string {
  return (Array.isArray(p) ? p[0] : p) ?? ''
}

export const getComments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const feedbackId = paramStr(req.params.feedbackId);
    
    const comments = await prisma.comment.findMany({
      where: { feedbackId, deletedAt: null },
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

export const createComment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const feedbackId = typeof req.body.feedbackId === 'string' ? req.body.feedbackId : ''
    const content = typeof req.body.content === 'string' ? req.body.content : ''
    const userId = req.user!.id;
    
    // Verificar que el feedback existe y no está soft-deleted
    const feedback = await prisma.feedback.findFirst({
      where: { id: feedbackId, deletedAt: null }
    });
    
    if (!feedback) {
      throw new AppError('Feedback no encontrado', 404);
    }

    // Validar que el usuario tiene acceso al feedback (es autor o destinatario)
    if (feedback.fromUserId !== userId && feedback.toUserId !== userId) {
      throw new AppError('No tienes acceso a este feedback', 403);
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

    await auditLog(req, {
      tableName: 'Comment',
      recordId: comment.id,
      action: 'CREATE',
      newData: { feedbackId, userId, content: comment.content },
    });
    
    res.status(201).json(comment);
  } catch (error) {
    next(error);
  }
};

export const deleteComment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = paramStr(req.params.id);
    const userId = req.user!.id;
    
    const comment = await prisma.comment.findFirst({
      where: { id, deletedAt: null }
    });
    
    if (!comment) {
      throw new AppError('Comentario no encontrado', 404);
    }
    
    // Solo el autor puede eliminar
    if (comment.userId !== userId) {
      throw new AppError('Solo el autor puede eliminar el comentario', 403);
    }
    
    // Soft delete: marcar deletedAt
    await prisma.comment.update({
      where: { id },
      data: { deletedAt: new Date() }
    });

    await auditLog(req, {
      tableName: 'Comment',
      recordId: id as string,
      action: 'DELETE',
      oldData: { feedbackId: comment.feedbackId, userId: comment.userId, content: comment.content },
    });
    
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
