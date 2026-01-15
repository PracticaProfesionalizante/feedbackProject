import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { AppError } from './errorHandler'
import { prisma } from '../utils/prisma'

export interface AuthRequest extends Request {
  userId?: string
  user?: {
    id: string
    role: string
    email: string
    name: string
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

      // Traer usuario para exponer role/email en req.user
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
