import type { Response, NextFunction } from 'express'
import type { Role } from '@prisma/client'
import type { AuthRequest } from './auth.middleware'

/**
 * Verifica que el usuario autenticado tenga el rol requerido (enum Role).
 */
export function requireRole(role: Role) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user?.role) return res.status(401).json({ message: 'Unauthorized' })
    if (req.user.role !== role) return res.status(403).json({ message: 'Forbidden' })
    next()
  }
}
