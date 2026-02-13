import type { Request, Response } from 'express'
import { Prisma } from '@prisma/client'
import { prisma } from '../utils/prisma'
import {
  idParamSchema,
  roleBodySchema,
  roleUpdateBodySchema,
} from '../validators/roleValidators'

export const roleController = {
  async list(req: Request, res: Response) {
    const roles = await prisma.accessRole.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return res.json({ items: roles })
  },

  async create(req: Request, res: Response) {
    const body = roleBodySchema.parse(req.body)
    try {
      const role = await prisma.accessRole.create({ data: body })
      return res.status(201).json({ item: role })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return res.status(409).json({ message: 'Role name already exists' })
      }
      throw error
    }
  },

  async update(req: Request, res: Response) {
    const { id } = idParamSchema.parse(req.params)
    const data = roleUpdateBodySchema.parse(req.body)

    const existing = await prisma.accessRole.findUnique({ where: { id } })
    if (!existing) return res.status(404).json({ message: 'Role not found' })

    try {
      const updated = await prisma.accessRole.update({
        where: { id },
        data,
      })
      return res.json({ item: updated })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return res.status(409).json({ message: 'Role name already exists' })
      }
      throw error
    }
  },

  async remove(req: Request, res: Response) {
    const { id } = idParamSchema.parse(req.params)

    const role = await prisma.accessRole.findUnique({ where: { id } })
    if (!role) return res.status(404).json({ message: 'Role not found' })

    const assignedCount = await prisma.userRoleLink.count({ where: { roleId: id } })
    if (assignedCount > 0) {
      return res.status(409).json({ message: 'Role is assigned to users and cannot be deleted' })
    }

    await prisma.accessRole.delete({ where: { id } })
    return res.status(204).send()
  },
}
