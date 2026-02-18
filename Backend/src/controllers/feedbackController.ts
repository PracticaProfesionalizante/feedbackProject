import type { Request, Response, NextFunction } from 'express'
import { Prisma } from '@prisma/client'
import { prisma } from '../utils/prisma'
import { AppError } from '../middleware/error.handler'
import { auditLog } from '../services/audit.service'
import { notificationService } from '../services/notification.service'
import {
  idParamSchema,
  listFeedbacksQuerySchema,
  createFeedbackPayloadSchema,
  updateFeedbackPayloadSchema,
} from '../validators/feedback.validator'

function getAuthUser(req: Request) {
  const user = req.user
  if (!user) {
    throw new AppError('Usuario no autenticado', 401)
  }
  return user
}

/* ======================================================
   LISTAR FEEDBACKS
====================================================== */

async function listFeedbacksCore(userId: string, rawQuery: unknown) {
  const query = listFeedbacksQuerySchema.parse(rawQuery)

  const where: Prisma.FeedbackWhereInput = {
    deletedAt: null,
    ...(query.type === 'received' ? { toUserId: userId } : { fromUserId: userId }),
  }

  const searchTrim = query.search?.trim()
  const isDateOnly = searchTrim && /^\d{4}-\d{2}-\d{2}$/.test(searchTrim)
  const dateFrom = query.dateFrom || (isDateOnly ? searchTrim : undefined)
  const dateTo = query.dateTo || (isDateOnly ? searchTrim : undefined)

  if (searchTrim && !isDateOnly) {
    where.OR = [
      { content: { contains: searchTrim, mode: 'insensitive' } },
      { fromUser: { name: { contains: searchTrim, mode: 'insensitive' } } },
      { fromUser: { email: { contains: searchTrim, mode: 'insensitive' } } },
      { toUser: { name: { contains: searchTrim, mode: 'insensitive' } } },
      { toUser: { email: { contains: searchTrim, mode: 'insensitive' } } },
    ]
  }
  if (dateFrom || dateTo) {
    where.createdAt = {}
    if (dateFrom) (where.createdAt as any).gte = new Date(dateFrom)
    if (dateTo) {
      const end = new Date(dateTo)
      end.setHours(23, 59, 59, 999)
      (where.createdAt as any).lte = end
    }
  }

  const page = query.page
  const limit = query.limit
  const skip = (page - 1) * limit

  const [items, total] = await Promise.all([
    prisma.feedback.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        fromUser: { select: { id: true, name: true, email: true, role: true } },
        toUser: { select: { id: true, name: true, email: true, role: true } },
        actions: {
          orderBy: { createdAt: 'asc' },
          select: { id: true, text: true, done: true, createdAt: true, updatedAt: true },
        },
      },
    }),
    prisma.feedback.count({ where }),
  ])

  return {
    items,
    total,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  }
}

/* ======================================================
   DETALLE FEEDBACK
====================================================== */

async function getFeedbackByIdCore(userId: string, feedbackId: string) {
  const feedback = await prisma.feedback.findFirst({
    where: { id: feedbackId, deletedAt: null },
    include: {
      fromUser: { select: { id: true, name: true, email: true, role: true } },
      toUser: { select: { id: true, name: true, email: true, role: true } },
      actions: {
        orderBy: { createdAt: 'asc' },
        select: { id: true, text: true, done: true, createdAt: true, updatedAt: true },
      },
    },
  })

  if (!feedback) {
    throw new AppError('Feedback no encontrado', 404)
  }

  // Privacidad estricta 1 a 1
  if (feedback.fromUserId !== userId && feedback.toUserId !== userId) {
    throw new AppError('Forbidden', 403)
  }

  return feedback
}

/* ======================================================
   CREAR FEEDBACK (todos contra todos)
====================================================== */

async function createFeedbackCore(req: Request) {
  const user = getAuthUser(req)
  const body = createFeedbackPayloadSchema.parse(req.body)

  if (body.toUserId === user.id) {
    throw new AppError('No puedes enviarte feedback a ti mismo', 400)
  }

  // ✅ Validar que el destinatario exista (seguridad)
  const toUserExists = await prisma.user.findUnique({
    where: { id: body.toUserId },
    select: { id: true },
  })
  if (!toUserExists) {
    throw new AppError('Destinatario no existe', 404)
  }

  // ✅ FIX: acá estaba roto por un texto "updateFeedbackCore" pegado
  const actions = Array.isArray((body as any).actions) ? (body as any).actions : []

  const created = await prisma.feedback.create({
    data: {
      fromUserId: user.id,
      toUserId: body.toUserId,
      content: body.content,
      actions: actions.length
        ? {
            create: actions
              .map((a: any) => ({ text: String(a.text ?? '').trim() }))
              .filter((a: any) => a.text),
          }
        : undefined,
      // contentEditedAt: null (implícito al crear)
    },
    include: {
      fromUser: { select: { id: true, name: true, email: true, role: true } },
      toUser: { select: { id: true, name: true, email: true, role: true } },
      actions: {
        orderBy: { createdAt: 'asc' },
        select: { id: true, text: true, done: true, createdAt: true, updatedAt: true },
      },
    },
  })

  await Promise.all([
    auditLog(req, {
      tableName: 'Feedback',
      recordId: created.id,
      action: 'CREATE',
      newData: created,
    }),
    notificationService.createFeedbackReceivedNotification(created.toUserId, user.name),
  ])

  return created
}

/* ======================================================
   EDITAR FEEDBACK (contenido/acciones solo por autor)
====================================================== */

async function updateFeedbackCore(req: Request) {
  const user = getAuthUser(req)
  const { id } = idParamSchema.parse(req.params)
  const body = updateFeedbackPayloadSchema.parse(req.body)

  const feedback = await prisma.feedback.findFirst({
    where: { id, deletedAt: null },
  })

  if (!feedback) throw new AppError('Feedback no encontrado', 404)

  // contenido solo autor
  if (body.content !== undefined && feedback.fromUserId !== user.id) {
    throw new AppError('Solo el autor puede modificar el contenido', 403)
  }

  // checklist: puede editar tanto el autor (líder) como el destinatario (empleado)
  const actions = (body as any).actions
  if (actions !== undefined) {
    const canEditActions = feedback.fromUserId === user.id || feedback.toUserId === user.id
    if (!canEditActions) {
      throw new AppError('Solo el autor o el destinatario pueden editar la checklist', 403)
    }
  }

  // ✅ contentEditedAt SOLO si se edita contenido o estructura de acciones
  const shouldMarkEdited = body.content !== undefined || actions !== undefined

  const updated = await prisma.$transaction(async (tx) => {
    if (actions !== undefined) {
      await tx.feedbackAction.deleteMany({ where: { feedbackId: id } })

      if (actions.length) {
        await tx.feedbackAction.createMany({
          data: actions
            .map((a: any) => ({
              feedbackId: id,
              text: String(a.text ?? '').trim(),
            }))
            .filter((a: any) => a.text),
        })
      }
    }

    return tx.feedback.update({
      where: { id },
      data: {
        ...(body.content !== undefined ? { content: body.content } : {}),
        ...(shouldMarkEdited ? { contentEditedAt: new Date() } : {}),
      },
      include: {
        fromUser: { select: { id: true, name: true, email: true, role: true } },
        toUser: { select: { id: true, name: true, email: true, role: true } },
        actions: {
          orderBy: { createdAt: 'asc' },
          select: { id: true, text: true, done: true, createdAt: true, updatedAt: true },
        },
      },
    })
  })

  await auditLog(req, {
    tableName: 'Feedback',
    recordId: id,
    action: 'UPDATE',
  })

  return updated
}

/* ======================================================
   ELIMINAR FEEDBACK (soft delete)
====================================================== */

async function deleteFeedbackCore(req: Request) {
  const user = getAuthUser(req)
  const { id } = idParamSchema.parse(req.params)

  const feedback = await prisma.feedback.findFirst({
    where: { id, deletedAt: null },
    select: { id: true, fromUserId: true, content: true },
  })

  if (!feedback) throw new AppError('Feedback no encontrado', 404)

  if (feedback.fromUserId !== user.id) {
    throw new AppError('Solo el autor puede eliminar el feedback', 403)
  }

  const now = new Date()

  await prisma.$transaction([
    prisma.comment.updateMany({ where: { feedbackId: id }, data: { deletedAt: now } }),
    prisma.feedback.update({ where: { id }, data: { deletedAt: now } }),
  ])

  await auditLog(req, {
    tableName: 'Feedback',
    recordId: id,
    action: 'DELETE',
    oldData: { fromUserId: feedback.fromUserId, content: feedback.content },
  })
}

/* ======================================================
   TOGGLE CHECKLIST (autor o receptor)
====================================================== */

async function toggleActionCore(req: Request, res: Response, next: NextFunction) {
  try {
    const user = getAuthUser(req)
    const feedbackId = req.params.id
    const actionId = req.params.actionId

    const action = await prisma.feedbackAction.findFirst({
      where: { id: actionId, feedbackId },
      include: { feedback: true },
    })

    if (!action) throw new AppError('Acción no encontrada', 404)

    const feedback = action.feedback

    if (feedback.fromUserId !== user.id && feedback.toUserId !== user.id) {
      throw new AppError('Forbidden', 403)
    }

    const updated = await prisma.feedbackAction.update({
      where: { id: actionId },
      data: { done: !action.done },
      select: { id: true, text: true, done: true, updatedAt: true },
    })

    res.json({ item: updated })
  } catch (error) {
    next(error)
  }
}

/* ======================================================
   EXPORTS
====================================================== */

export const feedbackController = {
  list: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = getAuthUser(req)
      const result = await listFeedbacksCore(user.id, req.query)
      res.json(result)
    } catch (error) {
      next(error)
    }
  },

  getById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = getAuthUser(req)
      const { id } = idParamSchema.parse(req.params)
      const feedback = await getFeedbackByIdCore(user.id, id)
      res.json(feedback)
    } catch (error) {
      next(error)
    }
  },

  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const created = await createFeedbackCore(req)
      res.status(201).json(created)
    } catch (error) {
      next(error)
    }
  },

  update: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const updated = await updateFeedbackCore(req)
      res.json(updated)
    } catch (error) {
      next(error)
    }
  },

  toggleAction: toggleActionCore,

  remove: async (req: Request, res: Response, next: NextFunction) => {
    try {
      await deleteFeedbackCore(req)
      res.status(204).send()
    } catch (error) {
      next(error)
    }
  },
}