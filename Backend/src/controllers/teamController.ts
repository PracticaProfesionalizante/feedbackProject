import type { Response } from 'express'
import { prisma } from '../utils/prisma'
import type { AuthRequest } from '../middleware/auth.middleware'

export const teamController = {
  // GET /api/team/employees (solo LEADER)
  async getEmployees(req: AuthRequest, res: Response) {
    const userId = req.userId!

    const teamMembers = await prisma.teamMember.findMany({
      where: { leaderId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        member: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    })

    const employees = teamMembers.map((tm) => ({
      ...tm.member,
      relationSince: tm.createdAt,
    }))

    return res.json({ employees })
  },

  // GET /api/team/leaders
  async getLeaders(req: AuthRequest, res: Response) {
    const userId = req.userId!

    const teamMembers = await prisma.teamMember.findMany({
      where: { memberId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        leader: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    })

    const leaders = teamMembers.map((tm) => ({
      ...tm.leader,
      relationSince: tm.createdAt,
    }))

    return res.json({ leaders })
  },
}
