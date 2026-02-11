import { Request, Response, NextFunction } from 'express'
import { authService } from '../services/auth.service'
import { AppError } from '../middleware/error.handler'
import { AuthRequest } from '../middleware/auth.middleware'
import { auditLog } from '../services/audit.service'

export const authController = {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, name } = req.body
      const user = await authService.register({ email, password, name })
      await auditLog(req, {
        tableName: 'User',
        recordId: user.id,
        action: 'CREATE',
        userId: user.id,
        newData: { email: user.email, name: user.name },
      })
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: user,
      })
    } catch (error) {
      next(error)
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body
      const result = await authService.login(email, password)
      await auditLog(req, {
        tableName: 'User',
        recordId: result.user.id,
        action: 'LOGIN',
        userId: result.user.id,
        newData: { email: result.user.email },
      })
      res.json({
        success: true,
        message: 'Login successful',
        data: result,
      })
    } catch (error) {
      next(error)
    }
  },

  async me(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.userId) {
        throw new AppError('Unauthorized', 401)
      }

      const user = await authService.me(req.userId)
      res.json({
        success: true,
        data: user,
      })
    } catch (error) {
      next(error)
    }
  },
}
