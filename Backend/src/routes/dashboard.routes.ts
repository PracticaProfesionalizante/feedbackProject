import { Router } from 'express'
import { requireAuth } from '../middleware/require.auth'
import { authenticate } from '../middleware/auth.middleware'
import { dashboardController } from '../controllers/dashboard.controller'

const router = Router()

router.get('/stats', authenticate, requireAuth, dashboardController.getStats)

export default router
