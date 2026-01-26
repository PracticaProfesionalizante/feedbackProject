import { PrismaClient, FeedbackType, FeedbackStatus } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

export const feedbackService = {
  
  // 1. CREAR FEEDBACK (Validando Jerarquía)
  async create(fromUserId: string, data: { toUserId: string; type: FeedbackType; content: string }) {
    if (fromUserId === data.toUserId) {
      throw new AppError("No puedes enviarte feedback a ti mismo", 400);
    }

    // Validar relación jerárquica (Bidireccional: Líder->Empleado O Empleado->Líder)
    const relation = await prisma.teamMember.findFirst({
      where: {
        OR: [
          { leaderId: fromUserId, memberId: data.toUserId }, // Soy su líder
          { leaderId: data.toUserId, memberId: fromUserId }  // Es mi líder
        ]
      }
    });

    if (!relation) {
      throw new AppError("No tienes permiso para dar feedback a este usuario (sin relación jerárquica)", 403);
    }

    return await prisma.feedback.create({
      data: {
        fromUserId,
        toUserId: data.toUserId,
        content: data.content,
        type: data.type,
        status: FeedbackStatus.PENDING
      }
    });
  },

  // 2. LISTAR FEEDBACKS (Paginación + Filtros)
  async findAll(userId: string, query: any) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    // Filtro base: por defecto traigo los RECIBIDOS, salvo que pida 'sent'
    const whereClause: any = query.type === 'sent' 
      ? { fromUserId: userId } 
      : { toUserId: userId };

    if (query.status) whereClause.status = query.status;
    if (query.feedbackType) whereClause.type = query.feedbackType;

    const [total, feedbacks] = await Promise.all([
      prisma.feedback.count({ where: whereClause }),
      prisma.feedback.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          fromUser: { select: { id: true, name: true, role: true } },
          toUser: { select: { id: true, name: true, role: true } }
        }
      })
    ]);

    return {
      data: feedbacks,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  },

  // 3. OBTENER DETALLE (Solo si soy parte del feedback)
  async findOne(userId: string, feedbackId: string) {
    const feedback = await prisma.feedback.findUnique({
      where: { id: feedbackId },
      include: {
        fromUser: { select: { id: true, name: true } },
        toUser: { select: { id: true, name: true } }
      }
    });

    if (!feedback) throw new AppError("Feedback no encontrado", 404);

    // Seguridad: Solo el emisor o el receptor pueden verlo
    if (feedback.fromUserId !== userId && feedback.toUserId !== userId) {
      throw new AppError("No tienes permiso para ver este feedback", 403);
    }

    return feedback;
  },

  // 4. ACTUALIZAR (Reglas complejas de permisos)
  async update(userId: string, feedbackId: string, data: { content?: string; status?: FeedbackStatus }) {
    const feedback = await prisma.feedback.findUnique({ where: { id: feedbackId } });
    if (!feedback) throw new AppError("Feedback no encontrado", 404);

    // REGLA: Actualizar CONTENIDO -> Solo el AUTOR
    if (data.content) {
      if (feedback.fromUserId !== userId) {
        throw new AppError("Solo el autor puede editar el contenido", 403);
      }
    }

    // REGLA: Actualizar ESTADO -> Solo el DESTINATARIO
    if (data.status) {
      if (feedback.toUserId !== userId) {
        throw new AppError("Solo el destinatario puede cambiar el estado", 403);
      }
    }

    return await prisma.feedback.update({
      where: { id: feedbackId },
      data
    });
  },

  // 5. ELIMINAR (Solo autor)
  async delete(userId: string, feedbackId: string) {
    const feedback = await prisma.feedback.findUnique({ where: { id: feedbackId } });
    if (!feedback) throw new AppError("Feedback no encontrado", 404);

    if (feedback.fromUserId !== userId) {
      throw new AppError("Solo el autor puede eliminar el feedback", 403);
    }

    return await prisma.feedback.delete({ where: { id: feedbackId } });
  }
};