import { prisma } from '../utils/prisma'
import { AppError } from '../middleware/error.handler'

/** Nodo del árbol de puestos (público para el tipo de retorno del servicio). */
export type PositionTreeNode = {
  id: string
  name: string
  area: { id: string; name: string }
  parentPositionId: string | null
  assignedUsers: Array<{ id: string; name: string; email: string }>
  children: PositionTreeNode[]
}

type UpsertPositionInput = {
  name: string
  areaId: string
  parentPositionId?: string | null
}

export const orgChartService = {
  /** Lista usuarios para asignar a puestos (admin). Búsqueda opcional por nombre o email. */
  async listUsersForAssignment(search?: string) {
    const searchTrim = typeof search === 'string' ? search.trim() : ''
    const where =
      searchTrim.length > 0
        ? {
            OR: [
              { name: { contains: searchTrim, mode: 'insensitive' as const } },
              { email: { contains: searchTrim, mode: 'insensitive' as const } },
            ],
          }
        : undefined
    return prisma.user.findMany({
      where,
      select: { id: true, name: true, email: true },
      orderBy: { name: 'asc' },
      take: 100,
    })
  },

  async listAreasWithPositions() {
    return prisma.orgArea.findMany({
      orderBy: { name: 'asc' },
      include: {
        positions: {
          orderBy: { name: 'asc' },
          include: {
            _count: { select: { userLinks: true } },
            parent: { select: { id: true, name: true } },
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
        parent: { select: { id: true, name: true } },
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

    if (input.parentPositionId) {
      const parent = await prisma.orgPosition.findUnique({
        where: { id: input.parentPositionId },
        select: { id: true },
      })
      if (!parent) throw new AppError('Parent position not found', 404)
    }

    return prisma.orgPosition.create({
      data: {
        name: input.name.trim(),
        areaId: input.areaId,
        parentPositionId: input.parentPositionId || undefined,
      },
      include: {
        area: { select: { id: true, name: true } },
        parent: { select: { id: true, name: true } },
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

    if (input.parentPositionId !== undefined) {
      if (input.parentPositionId) {
        const parent = await prisma.orgPosition.findUnique({
          where: { id: input.parentPositionId },
          select: { id: true },
        })
        if (!parent) throw new AppError('Parent position not found', 404)
        if (parent.id === id) throw new AppError('A position cannot be its own parent', 400)
        // Evitar ciclo: el padre no puede ser descendiente de id
        let current: string | null = input.parentPositionId
        const visited = new Set<string>([id])
        while (current) {
          if (visited.has(current)) throw new AppError('That parent would create a cycle', 400)
          visited.add(current)
          const parentPos: { parentPositionId: string | null } | null =
            await prisma.orgPosition.findUnique({
              where: { id: current },
              select: { parentPositionId: true },
            })
          current = parentPos?.parentPositionId ?? null
        }
      }
    }

    return prisma.orgPosition.update({
      where: { id },
      data: {
        name: input.name?.trim(),
        areaId: input.areaId,
        parentPositionId: input.parentPositionId === null ? null : input.parentPositionId,
      },
      include: {
        area: { select: { id: true, name: true } },
        parent: { select: { id: true, name: true } },
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

  /**
   * Árbol jerárquico por PUESTOS: raíces = puestos sin padre (parentPositionId null).
   * Cada nodo es un puesto con área, hijos (puestos) y usuarios asignados (0, 1 o varios).
   */
  async getPositionHierarchyTree(): Promise<{ tree: PositionTreeNode[] }> {
    const positions = await prisma.orgPosition.findMany({
      orderBy: [{ area: { name: 'asc' } }, { name: 'asc' }],
      include: {
        area: { select: { id: true, name: true } },
        userLinks: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    })

    const nodeMap = new Map<string, PositionTreeNode>()
    for (const p of positions) {
      nodeMap.set(p.id, {
        id: p.id,
        name: p.name,
        area: p.area,
        parentPositionId: p.parentPositionId ?? null,
        assignedUsers: p.userLinks.map((l) => l.user),
        children: [],
      })
    }

    const roots: PositionTreeNode[] = []
    for (const p of positions) {
      const node = nodeMap.get(p.id)!
      if (!p.parentPositionId) {
        roots.push(node)
      } else {
        const parent = nodeMap.get(p.parentPositionId)
        if (parent) parent.children.push(node)
        else roots.push(node)
      }
    }

    function sortChildren(n: PositionTreeNode) {
      n.children.sort((a, b) => a.name.localeCompare(b.name))
      n.children.forEach(sortChildren)
    }
    roots.sort((a, b) => a.name.localeCompare(b.name))
    roots.forEach(sortChildren)

    return { tree: roots }
  },
}

