import type { Response, NextFunction } from 'express'
import { prisma } from '../utils/prisma'
import type { AuthRequest } from './auth.middleware'

const ADMIN_ROLE_NAME = 'admin'

/**
 * Verifica que el usuario autenticado tenga el rol de acceso "admin" (tabla roles + user_roles).
 * Solo los usuarios con ese rol pueden acceder a la gestión de roles.
 */
export async function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId ?? req.user?.id
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const assignments = await prisma.userRoleLink.findMany({
      where: { userId },
      include: { role: { select: { name: true } } },
    })

    const hasAdmin = assignments.some((a) => a.role.name === ADMIN_ROLE_NAME)
    if (!hasAdmin) {
      return res.status(403).json({ message: 'Solo un administrador puede acceder a la gestión de roles' })
    }

    next()
  } catch (error) {
    next(error)
  }
}
