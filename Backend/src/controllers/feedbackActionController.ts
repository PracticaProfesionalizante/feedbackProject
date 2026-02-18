import type { Request, Response, NextFunction } from 'express'
import { prisma } from '../utils/prisma'
import { AppError } from '../middleware/error.handler'

/**
 * ✅ NUEVO controller separado para Acciones (checklist)
 * Motivo:
 * - Toggle (done/undone) lo puede hacer emisor o receptor
 * - NO debe marcar "Editado" (no tocar Feedback.contentEditedAt)
 * - Mantiene la edición de texto/estructura de acciones en feedbackController.update (solo autor)
 */
export const feedbackActionController = {
  async toggle(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user
      if (!user) throw new AppError('Usuario no autenticado', 401)

      const feedbackId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id ?? ''
      const actionId = Array.isArray(req.params.actionId) ? req.params.actionId[0] : req.params.actionId ?? ''
      const done = Boolean(req.body?.done)

      // 1) Verificar feedback existente y que el usuario sea participante (privacidad 1 a 1)
      const feedback = await prisma.feedback.findFirst({
        where: { id: feedbackId, deletedAt: null },
        select: { id: true, fromUserId: true, toUserId: true },
      })

      if (!feedback) throw new AppError('Feedback no encontrado', 404)

      const isParticipant = feedback.fromUserId === user.id || feedback.toUserId === user.id
      if (!isParticipant) {
        // Para privacidad más fuerte (no filtrar existencia), respondemos 404
        throw new AppError('Feedback no encontrado', 404)
      }

      // 2) Verificar que la acción pertenezca a ese feedback
      const action = await (prisma as any).feedbackAction.findFirst({
        where: { id: actionId, feedbackId },
        select: { id: true },
      })

      if (!action) throw new AppError('Acción no encontrada', 404)

      // 3) Actualizar solo el estado done
      // ✅ IMPORTANTE: NO tocar Feedback.contentEditedAt
      const updated = await (prisma as any).feedbackAction.update({
        where: { id: actionId },
        data: { done },
        select: { id: true, text: true, done: true, updatedAt: true },
      })

      return res.json({ item: updated })
    } catch (error) {
      next(error)
    }
  },
}