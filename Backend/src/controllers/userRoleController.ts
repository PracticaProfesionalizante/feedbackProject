import type { Request, Response } from 'express'
import { prisma } from '../utils/prisma'
import {
  roleIdsBodySchema,
  userIdParamSchema,
} from '../validators/roleValidators'

export const userRoleController = {
  async getUserRoles(req: Request, res: Response) {
    const { userId } = userIdParamSchema.parse(req.params)

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        assignedRoles: { select: { role: { select: { id: true, name: true, description: true } } } },
      },
    })

    if (!user) return res.status(404).json({ message: 'User not found' })

    return res.json({ roles: user.assignedRoles.map((ur) => ur.role) })
  },

  async replaceUserRoles(req: Request, res: Response) {
    const { userId } = userIdParamSchema.parse(req.params)
    const { roleIds } = roleIdsBodySchema.parse(req.body)

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return res.status(404).json({ message: 'User not found' })

    if (roleIds.length === 0) {
      // Permitir quitar todos los roles
      await prisma.userRoleLink.deleteMany({ where: { userId } })
      return res.json({ roles: [] })
    }

    const roles = await prisma.accessRole.findMany({
      where: { id: { in: roleIds } },
    })
    if (roles.length !== roleIds.length) {
      return res.status(404).json({ message: 'One or more roles not found' })
    }

    await prisma.$transaction([
      prisma.userRoleLink.deleteMany({ where: { userId } }),
      prisma.userRoleLink.createMany({
        data: roleIds.map((roleId) => ({ userId, roleId })),
      }),
    ])

    const updatedRoles = await prisma.accessRole.findMany({
      where: { id: { in: roleIds } },
    })

    return res.json({ roles: updatedRoles })
  },
}
