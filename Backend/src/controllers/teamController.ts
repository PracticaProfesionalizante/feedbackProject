import type { Response, NextFunction } from 'express'
import type { AuthRequest } from '../middleware/auth.middleware'
import { orgChartService } from '../services/org-chart.service'

export const teamController = {
  /**
   * GET /api/team/employees
   * Personas a cargo = usuarios cuyos puestos están POR DEBAJO de los míos en la jerarquía del organigrama.
   */
  async getEmployees(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!
      const employees = await orgChartService.getUsersInDescendantPositions(userId)
      return res.json({ employees })
    } catch (error) {
      console.error('[teamController.getEmployees]', error)
      next(error)
    }
  },

  /**
   * GET /api/team/leaders
   * Mis líderes = usuarios cuyos puestos están POR ENCIMA de los míos en la jerarquía del organigrama.
   */
  async getLeaders(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!
      const leaders = await orgChartService.getUsersInAncestorPositions(userId)
      return res.json({ leaders })
    } catch (error) {
      console.error('[teamController.getLeaders]', error)
      next(error)
    }
  },
}
