import type { NextFunction, Request, Response } from 'express'
import { Prisma } from '@prisma/client'
import { AppError } from '../middleware/error.handler'
import { rolesService } from '../services/roles.service'

function mapPrismaError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    throw new AppError('A role with the same name already exists', 409)
  }
  throw error
}

export const rolesController = {
  async listRoles(req: Request, res: Response, next: NextFunction) {
    try {
      const roles = await rolesService.listRoles()
      res.json({ roles })
    } catch (error) {
      next(error)
    }
  },

  async createRole(req: Request, res: Response, next: NextFunction) {
    try {
      const role = await rolesService.createRole(req.body)
      res.status(201).json({ role })
    } catch (error) {
      try {
        mapPrismaError(error)
      } catch (mappedError) {
        next(mappedError)
      }
    }
  },

  async updateRole(req: Request, res: Response, next: NextFunction) {
    try {
      const role = await rolesService.updateRole(req.params.id, req.body)
      res.json({ role })
    } catch (error) {
      try {
        mapPrismaError(error)
      } catch (mappedError) {
        next(mappedError)
      }
    }
  },

  async deleteRole(req: Request, res: Response, next: NextFunction) {
    try {
      await rolesService.deleteRole(req.params.id)
      res.status(204).send()
    } catch (error) {
      next(error)
    }
  },

  async listUserRoles(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await rolesService.getUserRoles(req.params.userId)
      res.json(result)
    } catch (error) {
      next(error)
    }
  },

  async replaceUserRoles(req: Request, res: Response, next: NextFunction) {
    try {
      const assignments = await rolesService.replaceUserRoles(req.params.userId, req.body.roleIds ?? [])
      res.json({ assignments })
    } catch (error) {
      next(error)
    }
  },
}

