import type { Request, Response } from 'express'
import { prisma } from '../utils/prisma'

export const userController = {
  async getProfile(req: Request, res: Response) {
    const userId = req.user!.id

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        // NUNCA password
      },
    })

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' })
    }

    // Stats (excluir soft-deleted)
    const [feedbacksGiven, feedbacksReceived, comments] = await Promise.all([
      prisma.feedback.count({ where: { fromUserId: userId, deletedAt: null } }),
      prisma.feedback.count({ where: { toUserId: userId, deletedAt: null } }),
      prisma.comment.count({ where: { userId, deletedAt: null } }),
    ])

    // Team info
    const [employeesCount, leadersCount] = await Promise.all([
      // Empleados directos (los miembros donde yo soy leader)
      prisma.teamMember.count({ where: { leaderId: userId } }),
      // Líderes directos (los leaders donde yo soy member)
      prisma.teamMember.count({ where: { memberId: userId } }),
    ])

    return res.json({
      ...user,
      stats: { feedbacksGiven, feedbacksReceived, comments },
      teamInfo: { employeesCount, leadersCount },
    })
  },
}