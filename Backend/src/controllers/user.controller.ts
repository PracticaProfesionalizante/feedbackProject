import type { Response } from 'express'
import type { AuthRequest } from '../middleware/auth.middleware'
import { prisma } from '../utils/prisma'
import { AppError } from '../middleware/error.handler'

async function buildProfile(req: AuthRequest, res: Response) {
  if (!req.userId) {
    throw new AppError('Unauthorized', 401)
  }

  const userId = req.userId

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      updatedAt: true,
      orgPositions: {
        orderBy: [{ position: { area: { name: 'asc' } } }, { position: { name: 'asc' } }],
        select: {
          position: {
            select: {
              id: true,
              name: true,
              area: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      },
    },
  })

  if (!user) {
    throw new AppError('User not found', 404)
  }

  const [feedbacksGiven, feedbacksReceived, comments, employeesCount, leadersCount] = await Promise.all([
    prisma.feedback.count({ where: { fromUserId: userId, deletedAt: null } }),
    prisma.feedback.count({ where: { toUserId: userId, deletedAt: null } }),
    prisma.comment.count({ where: { userId, deletedAt: null } }),
    prisma.teamMember.count({ where: { leaderId: userId } }),
    prisma.teamMember.count({ where: { memberId: userId } }),
  ])

  const positionsByAreaMap = new Map<
    string,
    { areaId: string; areaName: string; positions: Array<{ id: string; name: string }> }
  >()

  user.orgPositions.forEach((assignment) => {
    const areaId = assignment.position.area.id
    const areaName = assignment.position.area.name
    const current = positionsByAreaMap.get(areaId) ?? {
      areaId,
      areaName,
      positions: [],
    }
    current.positions.push({
      id: assignment.position.id,
      name: assignment.position.name,
    })
    positionsByAreaMap.set(areaId, current)
  })

  const { orgPositions, ...userBase } = user

  return res.json({
    user: {
      ...userBase,
      stats: {
        feedbacksGiven,
        feedbacksReceived,
        comments,
      },
      teamInfo: {
        employeesCount,
        leadersCount,
      },
      positions: orgPositions.map((assignment) => assignment.position),
      positionsByArea: Array.from(positionsByAreaMap.values()),
    },
  })
}

export const userController = {
  // GET /api/users/profile
  async profile(req: AuthRequest, res: Response) {
    return buildProfile(req, res)
  },

  // Alias para compatibilidad con imports/rutas anteriores.
  async getProfile(req: AuthRequest, res: Response) {
    return buildProfile(req, res)
  },
}
