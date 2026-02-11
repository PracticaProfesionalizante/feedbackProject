import { prisma } from '../utils/prisma'
import { AppError } from '../middleware/error.handler'

type UpsertPositionInput = {
  name: string
  areaId: string
}

export const orgChartService = {
  async listAreasWithPositions() {
    return prisma.orgArea.findMany({
      orderBy: { name: 'asc' },
      include: {
        positions: {
          orderBy: { name: 'asc' },
          include: {
            _count: { select: { userLinks: true } },
          },
        },
      },
    })
  },

  async createArea(name: string) {
    return prisma.orgArea.create({
      data: { name: name.trim() },
    })
  },

  async updateArea(id: string, name: string) {
    const exists = await prisma.orgArea.findUnique({ where: { id }, select: { id: true } })
    if (!exists) {
      throw new AppError('Area not found', 404)
    }

    return prisma.orgArea.update({
      where: { id },
      data: { name: name.trim() },
    })
  },

  async deleteArea(id: string) {
    const area = await prisma.orgArea.findUnique({
      where: { id },
      include: { _count: { select: { positions: true } } },
    })

    if (!area) {
      throw new AppError('Area not found', 404)
    }

    if (area._count.positions > 0) {
      throw new AppError('Cannot delete area with positions assigned', 409)
    }

    await prisma.orgArea.delete({ where: { id } })
  },

  async listPositions(areaId?: string) {
    if (areaId) {
      const areaExists = await prisma.orgArea.findUnique({
        where: { id: areaId },
        select: { id: true },
      })
      if (!areaExists) {
        throw new AppError('Area not found', 404)
      }
    }

    return prisma.orgPosition.findMany({
      where: areaId ? { areaId } : undefined,
      orderBy: [{ area: { name: 'asc' } }, { name: 'asc' }],
      include: {
        area: { select: { id: true, name: true } },
        _count: { select: { userLinks: true } },
      },
    })
  },

  async createPosition(input: UpsertPositionInput) {
    const areaExists = await prisma.orgArea.findUnique({
      where: { id: input.areaId },
      select: { id: true },
    })

    if (!areaExists) {
      throw new AppError('Area not found', 404)
    }

    return prisma.orgPosition.create({
      data: {
        name: input.name.trim(),
        areaId: input.areaId,
      },
      include: {
        area: { select: { id: true, name: true } },
      },
    })
  },

  async updatePosition(id: string, input: Partial<UpsertPositionInput>) {
    const current = await prisma.orgPosition.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!current) {
      throw new AppError('Position not found', 404)
    }

    if (input.areaId) {
      const areaExists = await prisma.orgArea.findUnique({
        where: { id: input.areaId },
        select: { id: true },
      })
      if (!areaExists) {
        throw new AppError('Area not found', 404)
      }
    }

    return prisma.orgPosition.update({
      where: { id },
      data: {
        name: input.name?.trim(),
        areaId: input.areaId,
      },
      include: {
        area: { select: { id: true, name: true } },
      },
    })
  },

  async deletePosition(id: string) {
    const exists = await prisma.orgPosition.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!exists) {
      throw new AppError('Position not found', 404)
    }

    await prisma.orgPosition.delete({ where: { id } })
  },

  async replaceUserPositions(userId: string, positionIds: string[]) {
    const userExists = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    })

    if (!userExists) {
      throw new AppError('User not found', 404)
    }

    const uniquePositionIds = [...new Set(positionIds)]

    if (uniquePositionIds.length > 0) {
      const existingPositions = await prisma.orgPosition.findMany({
        where: { id: { in: uniquePositionIds } },
        select: { id: true },
      })

      if (existingPositions.length !== uniquePositionIds.length) {
        throw new AppError('One or more positions do not exist', 404)
      }
    }

    await prisma.$transaction([
      prisma.userOrgPosition.deleteMany({ where: { userId } }),
      ...(uniquePositionIds.length > 0
        ? [
            prisma.userOrgPosition.createMany({
              data: uniquePositionIds.map((positionId) => ({
                userId,
                positionId,
              })),
            }),
          ]
        : []),
    ])

    return prisma.userOrgPosition.findMany({
      where: { userId },
      orderBy: [{ position: { area: { name: 'asc' } } }, { position: { name: 'asc' } }],
      include: {
        position: {
          include: {
            area: { select: { id: true, name: true } },
          },
        },
      },
    })
  },

  async getUserPositions(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    })

    if (!user) {
      throw new AppError('User not found', 404)
    }

    const assignments = await prisma.userOrgPosition.findMany({
      where: { userId },
      orderBy: [{ position: { area: { name: 'asc' } } }, { position: { name: 'asc' } }],
      include: {
        position: {
          include: {
            area: { select: { id: true, name: true } },
          },
        },
      },
    })

    return {
      user,
      assignments,
    }
  },
}

