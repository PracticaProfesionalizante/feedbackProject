import { Router } from 'express'
import { teamController } from '../controllers/teamController'
import { requireAuth } from '../middleware/requireAuth'
import { requireRole } from '../middleware/requireRole'
import { Role } from '@prisma/client'

const router = Router()

router.get('/employees', requireAuth, requireRole(Role.LEADER), teamController.getEmployees)
router.get('/leaders', requireAuth, teamController.getLeaders)

export default router