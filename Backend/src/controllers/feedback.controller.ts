import type { Request, Response, NextFunction } from 'express'
import { Prisma, FeedbackStatus } from '@prisma/client'
import { prisma } from '../utils/prisma'
import { AppError } from '../middleware/error.handler'
import { auditLog } from '../services/audit.service'
import { notificationService } from '../services/notification.service'
import {
  idParamSchema,
  listFeedbacksQuerySchema,
  recentFeedbacksQuerySchema,
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

async function listFeedbacksCore(userId: string, rawQuery: unknown) {
  const query = listFeedbacksQuerySchema.parse(rawQuery)

  const where: Prisma.FeedbackWhereInput = {
    deletedAt: null,
    ...(query.type === 'received' ? { toUserId: userId } : { fromUserId: userId }),
    ...(query.status ? { status: query.status } : {}),
    ...(query.feedbackType ? { type: query.feedbackType } : {}),
  }

  const search = (query.search ?? '').trim()
  if (search) {
    const or: Prisma.FeedbackWhereInput[] = [
      { content: { contains: search, mode: Prisma.QueryMode.insensitive } },
    ]

    if (query.type === 'received') {
      or.push({
        fromUser: { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
      })
    } else {
      or.push({
        toUser: { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
      })
    }

    where.OR = or
  }

  if (query.dateFrom || query.dateTo) {
    const createdAt: Prisma.DateTimeFilter = {}

    if (query.dateFrom) {
      const from = new Date(query.dateFrom)
      if (Number.isNaN(from.getTime())) {
        throw new AppError('dateFrom invalido', 400)
      }
      createdAt.gte = from
    }

    if (query.dateTo) {
      const to = new Date(query.dateTo)
      if (Number.isNaN(to.getTime())) {
        throw new AppError('dateTo invalido', 400)
      }
      to.setHours(23, 59, 59, 999)
      createdAt.lte = to
    }

    where.createdAt = createdAt
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
      },
    }),
    prisma.feedback.count({ where }),
  ])

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  }
}

async function getFeedbackByIdCore(userId: string, feedbackId: string) {
  const feedback = await prisma.feedback.findFirst({
    where: { id: feedbackId, deletedAt: null },
    include: {
      fromUser: { select: { id: true, name: true, email: true, role: true } },
      toUser: { select: { id: true, name: true, email: true, role: true } },
      comments: {
        where: { deletedAt: null },
        orderBy: { createdAt: 'asc' },
        include: { user: { select: { id: true, name: true, email: true, role: true } } },
      },
    },
  })

  if (!feedback) {
    throw new AppError('Feedback no encontrado', 404)
  }

  if (feedback.fromUserId !== userId && feedback.toUserId !== userId) {
    throw new AppError('Forbidden', 403)
  }

  return feedback
}

async function createFeedbackCore(req: Request) {
  const user = getAuthUser(req)
  const body = createFeedbackPayloadSchema.parse(req.body)

  if (body.toUserId === user.id) {
    throw new AppError('No puedes enviarte feedback a ti mismo', 400)
  }

  const relation = await prisma.teamMember.findFirst({
    where: {
      OR: [
        { leaderId: user.id, memberId: body.toUserId },
        { leaderId: body.toUserId, memberId: user.id },
      ],
    },
    select: { id: true },
  })

  if (!relation) {
    throw new AppError('No existe relacion jerarquica entre usuarios', 403)
  }

  const created = await prisma.feedback.create({
    data: {
      fromUserId: user.id,
      toUserId: body.toUserId,
      type: body.type,
      content: body.content,
    },
    include: {
      fromUser: { select: { id: true, name: true, email: true, role: true } },
      toUser: { select: { id: true, name: true, email: true, role: true } },
    },
  })

  await Promise.all([
    auditLog(req, {
      tableName: 'Feedback',
      recordId: created.id,
      action: 'CREATE',
      newData: {
        type: created.type,
        content: created.content,
        fromUserId: created.fromUserId,
        toUserId: created.toUserId,
      },
    }),
    notificationService.createFeedbackReceivedNotification(created.toUserId, user.name),
  ])

  return created
}

async function updateFeedbackCore(req: Request) {
  const user = getAuthUser(req)
  const { id } = idParamSchema.parse(req.params)
  const body = updateFeedbackPayloadSchema.parse(req.body)

  const feedback = await prisma.feedback.findFirst({
    where: { id, deletedAt: null },
    select: { id: true, fromUserId: true, toUserId: true, content: true, status: true },
  })

  if (!feedback) {
    throw new AppError('Feedback no encontrado', 404)
  }

  if (body.content !== undefined && feedback.fromUserId !== user.id) {
    throw new AppError('Solo el autor puede modificar el contenido', 403)
  }
  if (body.status !== undefined && feedback.toUserId !== user.id) {
    throw new AppError('Solo el destinatario puede modificar el estado', 403)
  }

  const updated = await prisma.feedback.update({
    where: { id },
    data: {
      ...(body.content !== undefined ? { content: body.content } : {}),
      ...(body.status !== undefined ? { status: body.status } : {}),
    },
    include: {
      fromUser: { select: { id: true, name: true, email: true, role: true } },
      toUser: { select: { id: true, name: true, email: true, role: true } },
    },
  })

  const tasks: Array<Promise<unknown>> = [
    auditLog(req, {
      tableName: 'Feedback',
      recordId: id,
      action: 'UPDATE',
      oldData: { content: feedback.content, status: feedback.status },
      newData: { content: updated.content, status: updated.status },
    }),
  ]

  if (body.status !== undefined && feedback.status !== body.status) {
    tasks.push(
      notificationService.createFeedbackUpdatedNotification(feedback.fromUserId, body.status)
    )
  }

  await Promise.all(tasks)

  return updated
}

async function updateStatusCore(req: Request) {
  const user = getAuthUser(req)
  const { id } = idParamSchema.parse(req.params)
  const requestedStatus = req.body?.status as FeedbackStatus

  const feedback = await prisma.feedback.findFirst({
    where: { id, deletedAt: null },
  })

  if (!feedback) {
    throw new AppError('Feedback no encontrado', 404)
  }

  if (feedback.toUserId !== user.id) {
    throw new AppError('Solo el destinatario puede cambiar el estado', 403)
  }

  const currentStatus = feedback.status
  const newStatus = requestedStatus

  if (currentStatus === FeedbackStatus.COMPLETED) {
    throw new AppError('No se puede cambiar el estado de un feedback completado', 400)
  }
  if (currentStatus === FeedbackStatus.IN_PROGRESS && newStatus === FeedbackStatus.PENDING) {
    throw new AppError('No se puede retroceder de IN_PROGRESS a PENDING', 400)
  }

  const validTransitions: Record<FeedbackStatus, FeedbackStatus[]> = {
    [FeedbackStatus.PENDING]: [FeedbackStatus.IN_PROGRESS, FeedbackStatus.COMPLETED],
    [FeedbackStatus.IN_PROGRESS]: [FeedbackStatus.COMPLETED],
    [FeedbackStatus.COMPLETED]: [],
  }

  if (!validTransitions[currentStatus].includes(newStatus)) {
    throw new AppError(
      `Transicion invalida: No se puede cambiar de ${currentStatus} a ${newStatus}`,
      400
    )
  }

  const updated = await prisma.feedback.update({
    where: { id },
    data: { status: newStatus },
    include: {
      fromUser: { select: { id: true, name: true } },
      toUser: { select: { id: true, name: true } },
    },
  })

  await Promise.all([
    auditLog(req, {
      tableName: 'Feedback',
      recordId: id,
      action: 'UPDATE',
      oldData: { status: currentStatus },
      newData: { status: newStatus },
    }),
    notificationService.createFeedbackUpdatedNotification(feedback.fromUserId, newStatus),
  ])

  return updated
}

async function deleteFeedbackCore(req: Request) {
  const user = getAuthUser(req)
  const { id } = idParamSchema.parse(req.params)

  const feedback = await prisma.feedback.findFirst({
    where: { id, deletedAt: null },
    select: { id: true, fromUserId: true, content: true, status: true },
  })

  if (!feedback) {
    throw new AppError('Feedback no encontrado', 404)
  }

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
    oldData: {
      fromUserId: feedback.fromUserId,
      content: feedback.content,
      status: feedback.status,
    },
  })
}

export const createFeedback = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const created = await createFeedbackCore(req)
    res.status(201).json(created)
  } catch (error) {
    next(error)
  }
}

export const getFeedbacks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = getAuthUser(req)
    const result = await listFeedbacksCore(user.id, req.query)
    res.json(result)
  } catch (error) {
    next(error)
  }
}

export const getRecentFeedbacks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = getAuthUser(req)
    const query = recentFeedbacksQuerySchema.parse(req.query)
    const feedbacks = await prisma.feedback.findMany({
      where: {
        deletedAt: null,
        OR: [{ toUserId: user.id }, { fromUserId: user.id }],
      },
      include: {
        fromUser: { select: { id: true, name: true, email: true } },
        toUser: { select: { id: true, name: true, email: true } },
        _count: { select: { comments: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: query.limit,
    })
    res.json({ feedbacks })
  } catch (error) {
    next(error)
  }
}

export const getFeedbackById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = getAuthUser(req)
    const { id } = idParamSchema.parse(req.params)
    const feedback = await getFeedbackByIdCore(user.id, id)
    res.json(feedback)
  } catch (error) {
    next(error)
  }
}

export const updateFeedback = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updated = await updateFeedbackCore(req)
    res.json(updated)
  } catch (error) {
    next(error)
  }
}

export const updateStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updated = await updateStatusCore(req)
    res.json(updated)
  } catch (error) {
    next(error)
  }
}

export const deleteFeedback = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await deleteFeedbackCore(req)
    res.status(204).send()
  } catch (error) {
    next(error)
  }
}

export const feedbackController = {
  async getRecent(req: Request, res: Response, next: NextFunction) {
    try {
      const user = getAuthUser(req)
      const items = await prisma.feedback.findMany({
        where: {
          deletedAt: null,
          OR: [{ toUserId: user.id }, { fromUserId: user.id }],
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          fromUser: { select: { id: true, name: true, email: true, role: true } },
          toUser: { select: { id: true, name: true, email: true, role: true } },
        },
      })
      res.json({ items })
    } catch (error) {
      next(error)
    }
  },

  async list(req: Request, res: Response, next: NextFunction) {
    return getFeedbacks(req, res, next)
  },

  async recent(req: Request, res: Response, next: NextFunction) {
    try {
      const user = getAuthUser(req)
      const query = recentFeedbacksQuerySchema.parse(req.query)
      const [received, sent] = await Promise.all([
        prisma.feedback.findMany({
          where: { toUserId: user.id, deletedAt: null },
          orderBy: { createdAt: 'desc' },
          take: query.limit,
          include: {
            fromUser: { select: { id: true, name: true, email: true, role: true } },
            toUser: { select: { id: true, name: true, email: true, role: true } },
          },
        }),
        prisma.feedback.findMany({
          where: { fromUserId: user.id, deletedAt: null },
          orderBy: { createdAt: 'desc' },
          take: query.limit,
          include: {
            fromUser: { select: { id: true, name: true, email: true, role: true } },
            toUser: { select: { id: true, name: true, email: true, role: true } },
          },
        }),
      ])

      const all = [...received, ...sent]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, query.limit)

      res.json(all)
    } catch (error) {
      next(error)
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    return getFeedbackById(req, res, next)
  },

  async create(req: Request, res: Response, next: NextFunction) {
    return createFeedback(req, res, next)
  },

  async update(req: Request, res: Response, next: NextFunction) {
    return updateFeedback(req, res, next)
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    return deleteFeedback(req, res, next)
  },
}
