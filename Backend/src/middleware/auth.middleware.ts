import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { Role } from '@prisma/client'
import { AppError } from './error.handler'
import { prisma } from '../utils/prisma'
import { JWT_SECRET } from '../config/constants'

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
        JWT_SECRET
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

// Alias para compatibilidad con importaciones previas (authMiddleware)
export const authMiddleware = authenticate
// Export default para consumidores que importan sin destructurar
export default authenticate
