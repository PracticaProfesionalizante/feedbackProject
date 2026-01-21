import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { Role } from '@prisma/client'
import { AppError } from './errorHandler'
import { prisma } from '../utils/prisma'

export type AuthUser = {
  id: string
  role: Role
  email: string
  name: string
}

export type AuthRequest = Request & {
  userId?: string
  user?: AuthUser
}

declare global {
  namespace Express {
    interface Request {
      userId?: string
      user?: AuthUser
    }
  }
}

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  ;(async () => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '')

      if (!token) {
        throw new AppError('No token provided', 401)
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'secret'
      ) as { userId: string }

      req.userId = decoded.userId

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, role: true, email: true, name: true },
      })

      if (!user) {
        throw new AppError('User not found', 401)
      }

      req.user = user
      next()
    } catch (error) {
      const appError = new AppError('Invalid or expired token', 401)
      next(appError)
    }
  })()
}
