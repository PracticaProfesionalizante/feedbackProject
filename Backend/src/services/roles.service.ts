import { prisma } from '../utils/prisma'
import { AppError } from '../middleware/error.handler'

type CreateRoleInput = {
  name: string
  description?: string | null
}

type UpdateRoleInput = Partial<CreateRoleInput>

function sanitizeDescription(description?: string | null) {
  if (description === undefined) return undefined
  if (description === null) return null
  const trimmed = description.trim()
  return trimmed.length === 0 ? null : trimmed
}

export const rolesService = {
  async listRoles() {
    return prisma.accessRole.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { users: true } },
      },
    })
  },

  async createRole(input: CreateRoleInput) {
    return prisma.accessRole.create({
      data: {
        name: input.name.trim(),
        description: sanitizeDescription(input.description),
      },
    })
  },

  async updateRole(id: string, input: UpdateRoleInput) {
    const existing = await prisma.accessRole.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!existing) {
      throw new AppError('Role not found', 404)
    }

    return prisma.accessRole.update({
      where: { id },
      data: {
        name: input.name?.trim(),
        description: sanitizeDescription(input.description),
      },
    })
  },

  async deleteRole(id: string) {
    const existing = await prisma.accessRole.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!existing) {
      throw new AppError('Role not found', 404)
    }

    await prisma.accessRole.delete({ where: { id } })
  },

  async replaceUserRoles(userId: string, roleIds: string[]) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    })

    if (!user) {
      throw new AppError('User not found', 404)
    }

    const uniqueRoleIds = [...new Set(roleIds)]

    if (uniqueRoleIds.length > 0) {
      const existingRoles = await prisma.accessRole.findMany({
        where: { id: { in: uniqueRoleIds } },
        select: { id: true },
      })

      if (existingRoles.length !== uniqueRoleIds.length) {
        throw new AppError('One or more roles do not exist', 404)
      }
    }

    await prisma.$transaction([
      prisma.userRoleLink.deleteMany({ where: { userId } }),
      ...(uniqueRoleIds.length > 0
        ? [
            prisma.userRoleLink.createMany({
              data: uniqueRoleIds.map((roleId) => ({
                userId,
                roleId,
              })),
            }),
          ]
        : []),
    ])

    return prisma.userRoleLink.findMany({
      where: { userId },
      orderBy: [{ role: { name: 'asc' } }],
      include: {
        role: true,
      },
    })
  },

  async getUserRoles(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    })

    if (!user) {
      throw new AppError('User not found', 404)
    }

    const assignments = await prisma.userRoleLink.findMany({
      where: { userId },
      orderBy: [{ role: { name: 'asc' } }],
      include: {
        role: true,
      },
    })

    return {
      user,
      assignments,
    }
  },
}

