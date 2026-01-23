import type { Request, Response } from 'express'
import { prisma } from '../utils/prisma'
import {
  idParamSchema,
  listFeedbacksQuerySchema,
  recentFeedbacksQuerySchema,
  createFeedbackSchema,
  updateFeedbackSchema,
} from '../validators/feedbackValidators'

export const feedbackController = {


  // GET /api/feedbacks/recent
  async getRecent(req: Request, res: Response) {
    const userId = req.user!.id

    const items = await prisma.feedback.findMany({
      where: {
        OR: [{ toUserId: userId }, { fromUserId: userId }],
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        fromUser: { select: { id: true, name: true, email: true, role: true } },
        toUser: { select: { id: true, name: true, email: true, role: true } },
      },
    })

    return res.json({ items })
  },
  // GET /api/feedbacks?type=received|sent&status=...&feedbackType=...&page=1&limit=10
  async list(req: Request, res: Response) {
    const userId = req.user!.id
    const query = listFeedbacksQuerySchema.parse(req.query)

    const where: any = {}

    // type filter: received vs sent
    if (query.type === 'received') where.toUserId = userId
    else where.fromUserId = userId

    if (query.status) where.status = query.status
    if (query.feedbackType) where.type = query.feedbackType

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

    return res.json({
      items,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  },

  // GET /api/feedbacks/recent?limit=10
  async recent(req: Request, res: Response) {
    const userId = req.user!.id
    const query = recentFeedbacksQuerySchema.parse(req.query)

    // Obtener feedbacks recibidos y enviados, mezclados
    const [received, sent] = await Promise.all([
      prisma.feedback.findMany({
        where: { toUserId: userId },
        orderBy: { createdAt: 'desc' },
        take: query.limit,
        include: {
          fromUser: { select: { id: true, name: true, email: true, role: true } },
          toUser: { select: { id: true, name: true, email: true, role: true } },
        },
      }),
      prisma.feedback.findMany({
        where: { fromUserId: userId },
        orderBy: { createdAt: 'desc' },
        take: query.limit,
        include: {
          fromUser: { select: { id: true, name: true, email: true, role: true } },
          toUser: { select: { id: true, name: true, email: true, role: true } },
        },
      }),
    ])

    // Combinar y ordenar por fecha
    const all = [...received, ...sent]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, query.limit)

    return res.json(all)
  },

  // GET /api/feedbacks/:id
  async getById(req: Request, res: Response) {
    const userId = req.user!.id
    const { id } = idParamSchema.parse(req.params)

    const feedback = await prisma.feedback.findUnique({
      where: { id },
      include: {
        fromUser: { select: { id: true, name: true, email: true, role: true } },
        toUser: { select: { id: true, name: true, email: true, role: true } },
        comments: {
          orderBy: { createdAt: 'asc' },
          include: { user: { select: { id: true, name: true, email: true, role: true } } },
        },
      },
    })

    if (!feedback) return res.status(404).json({ message: 'Feedback no encontrado' })

    // Solo autor o destinatario
    if (feedback.fromUserId !== userId && feedback.toUserId !== userId) {
      return res.status(403).json({ message: 'Forbidden' })
    }

    return res.json(feedback)
  },

  // POST /api/feedbacks
  async create(req: Request, res: Response) {
    const userId = req.user!.id
    const body = createFeedbackSchema.parse(req.body)

    if (body.toUserId === userId) {
      return res.status(400).json({ message: 'No puedes enviarte feedback a ti mismo' })
    }

    // Verificar relación TeamMember en cualquier dirección
    const relation = await prisma.teamMember.findFirst({
      where: {
        OR: [
          { leaderId: userId, memberId: body.toUserId },
          { leaderId: body.toUserId, memberId: userId },
        ],
      },
      select: { id: true },
    })

    if (!relation) {
      return res.status(403).json({ message: 'No existe relación jerárquica entre usuarios' })
    }

    const created = await prisma.feedback.create({
      data: {
        fromUserId: userId,
        toUserId: body.toUserId,
        type: body.type,
        content: body.content,
      },
      include: {
        fromUser: { select: { id: true, name: true, email: true, role: true } },
        toUser: { select: { id: true, name: true, email: true, role: true } },
      },
    })

    // (Opcional) crear notificación al destinatario
    // await prisma.notification.create({ ... })

    return res.status(201).json(created)
  },

  // PATCH /api/feedbacks/:id
  async update(req: Request, res: Response) {
    const userId = req.user!.id
    const { id } = idParamSchema.parse(req.params)
    const body = updateFeedbackSchema.parse(req.body)

    const feedback = await prisma.feedback.findUnique({
      where: { id },
      select: { id: true, fromUserId: true, toUserId: true, content: true, status: true },
    })

    if (!feedback) return res.status(404).json({ message: 'Feedback no encontrado' })

    // Permisos: content solo autor, status solo destinatario
    if (body.content !== undefined && feedback.fromUserId !== userId) {
      return res.status(403).json({ message: 'Solo el autor puede modificar el contenido' })
    }
    if (body.status !== undefined && feedback.toUserId !== userId) {
      return res.status(403).json({ message: 'Solo el destinatario puede modificar el estado' })
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

    // (Opcional) notificación al autor o destinatario según cambio
    return res.json(updated)
  },

  // DELETE /api/feedbacks/:id (solo autor)
  async remove(req: Request, res: Response) {
    const userId = req.user!.id
    const { id } = idParamSchema.parse(req.params)

    const feedback = await prisma.feedback.findUnique({
      where: { id },
      select: { id: true, fromUserId: true },
    })

    if (!feedback) return res.status(404).json({ message: 'Feedback no encontrado' })
    if (feedback.fromUserId !== userId) {
      return res.status(403).json({ message: 'Solo el autor puede eliminar el feedback' })
    }

    await prisma.feedback.delete({ where: { id } })
    return res.status(204).send()
  },
}