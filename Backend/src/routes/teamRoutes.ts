import { Router } from 'express'
import { teamController } from '../controllers/teamController'
import { requireAuth } from '../middleware/require.auth'
import { Role } from '@prisma/client'
import { requireRole } from '../middleware/require.role'
import { authenticate } from '../middleware/auth.middleware'

const router = Router()

router.use(authenticate)
router.get('/employees', requireAuth, requireRole(Role.LEADER), teamController.getEmployees)
router.get('/leaders', requireAuth, teamController.getLeaders)

export default router
