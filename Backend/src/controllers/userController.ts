import type { Response } from 'express'
import type { AuthRequest } from '../middleware/auth.middleware'
import { prisma } from '../utils/prisma'
import { AppError } from '../middleware/error.handler'

type ProfileUser = {
  id: string
  email: string
  name: string
  birthdate: Date | null
  country: string | null
  createdAt: Date
  updatedAt: Date
  orgPositions: Array<{
    position: { id: string; name: string; area: { id: string; name: string } }
  }>
  assignedRoles: Array<{
    role: { id: string; name: string; description: string | null }
  }>
}

async function buildProfile(req: AuthRequest, res: Response) {
  if (!req.userId) {
    throw new AppError('Unauthorized', 401)
  }

  const userId = req.userId

  const user = await (prisma.user.findUnique as unknown as (args: {
    where: { id: string }
    select: Record<string, unknown>
  }) => Promise<ProfileUser | null>)({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      birthdate: true,
      country: true,
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
      assignedRoles: {
        orderBy: [{ role: { name: 'asc' } }],
        select: {
          role: {
            select: {
              id: true,
              name: true,
              description: true,
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

  const { orgPositions, assignedRoles, ...userBase } = user

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
      roles: assignedRoles.map((assignment) => assignment.role),
    },
  })
}

type UpdateProfileBody = {
  name?: string
  email?: string
  birthdate?: string | null
  country?: string | null
}

async function updateProfile(req: AuthRequest, res: Response) {
  if (!req.userId) {
    throw new AppError('Unauthorized', 401)
  }

  const { name, email, birthdate, country } = req.body as UpdateProfileBody

  const updateData: Record<string, unknown> = {}

  if (name !== undefined && typeof name === 'string' && name.trim()) {
    updateData.name = name.trim()
  }
  if (email !== undefined && typeof email === 'string' && email.trim()) {
    updateData.email = email.trim()
  }
  if (birthdate !== undefined) {
    updateData.birthdate = birthdate ? new Date(birthdate) : null
  }
  if (country !== undefined) {
    updateData.country = country && typeof country === 'string' ? country.trim() || null : null
  }

  if (Object.keys(updateData).length === 0) {
    return buildProfile(req, res)
  }

  await prisma.user.update({
    where: { id: req.userId },
    data: updateData,
  })

  return buildProfile(req, res)
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

  // PATCH /api/users/profile
  updateProfile,
}
