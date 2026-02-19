import type { NextFunction, Request, Response } from 'express'
import { Prisma } from '@prisma/client'
import { AppError } from '../middleware/error.handler'
import { orgChartService } from '../services/org-chart.service'

function mapPrismaError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    throw new AppError('A record with the same unique fields already exists', 409)
  }
  throw error
}

function paramStr(p: string | string[] | undefined): string {
  return (Array.isArray(p) ? p[0] : p) ?? ''
}

export const orgChartController = {
  async listAreas(req: Request, res: Response, next: NextFunction) {
    try {
      const areas = await orgChartService.listAreasWithPositions()
      res.json({ areas })
    } catch (error) {
      next(error)
    }
  },

  async createArea(req: Request, res: Response, next: NextFunction) {
    try {
      const area = await orgChartService.createArea(req.body.name)
      res.status(201).json({ area })
    } catch (error) {
      try {
        mapPrismaError(error)
      } catch (mappedError) {
        next(mappedError)
      }
    }
  },

  async updateArea(req: Request, res: Response, next: NextFunction) {
    try {
      const area = await orgChartService.updateArea(paramStr(req.params.id), req.body.name)
      res.json({ area })
    } catch (error) {
      try {
        mapPrismaError(error)
      } catch (mappedError) {
        next(mappedError)
      }
    }
  },

  async deleteArea(req: Request, res: Response, next: NextFunction) {
    try {
      await orgChartService.deleteArea(paramStr(req.params.id))
      res.status(204).send()
    } catch (error) {
      next(error)
    }
  },

  async listPositions(req: Request, res: Response, next: NextFunction) {
    try {
      const areaId = typeof req.query.areaId === 'string' ? req.query.areaId : undefined
      const positions = await orgChartService.listPositions(areaId)
      res.json({ positions })
    } catch (error) {
      next(error)
    }
  },

  async createPosition(req: Request, res: Response, next: NextFunction) {
    try {
      const position = await orgChartService.createPosition(req.body)
      res.status(201).json({ position })
    } catch (error) {
      try {
        mapPrismaError(error)
      } catch (mappedError) {
        next(mappedError)
      }
    }
  },

  async updatePosition(req: Request, res: Response, next: NextFunction) {
    try {
      const position = await orgChartService.updatePosition(paramStr(req.params.id), req.body)
      res.json({ position })
    } catch (error) {
      try {
        mapPrismaError(error)
      } catch (mappedError) {
        next(mappedError)
      }
    }
  },

  async deletePosition(req: Request, res: Response, next: NextFunction) {
    try {
      await orgChartService.deletePosition(paramStr(req.params.id))
      res.status(204).send()
    } catch (error) {
      next(error)
    }
  },

  async listUserPositions(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await orgChartService.getUserPositions(paramStr(req.params.userId))
      res.json(result)
    } catch (error) {
      next(error)
    }
  },
  async replaceUserPositions(req: Request, res: Response, next: NextFunction) {
    try {
      const assignments = await orgChartService.replaceUserPositions(
        paramStr(req.params.userId),
        req.body.positionIds ?? []
      )
      res.json({ assignments })
    } catch (error) {
      next(error)
    }
  },
}

