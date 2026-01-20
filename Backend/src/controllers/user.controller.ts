import type { Response } from 'express'
import type { AuthRequest } from '../middleware/auth.middleware'
import { prisma } from '../utils/prisma'
import { AppError } from '../middleware/errorHandler'

export const userController = {
  // GET /api/users/profile
  async profile(req: AuthRequest, res: Response) {
    if (!req.userId) {
      throw new AppError('Unauthorized', 401)
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
      throw new AppError('User not found', 404)
    }

    // TODO: Ajustar si hay stats/teamInfo calculados en otra capa
    res.json({ user })
  },
}
