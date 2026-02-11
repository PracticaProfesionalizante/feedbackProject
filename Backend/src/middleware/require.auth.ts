import type { Response, NextFunction } from 'express'
import type { AuthRequest } from './auth.middleware'

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.userId) {
    return res.status(401).json({ message: 'Unauthorized' })
  }
  next()
}

