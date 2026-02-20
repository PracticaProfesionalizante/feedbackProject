import { Router } from 'express'
import { teamController } from '../controllers/teamController'
import { requireAuth } from '../middleware/require.auth'
import { authenticate } from '../middleware/auth.middleware'

const router = Router()

router.use(authenticate)
router.get('/employees', requireAuth, teamController.getEmployees)
router.get('/leaders', requireAuth, teamController.getLeaders)

export default router
