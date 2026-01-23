import { Router } from 'express'
import { getDashboardStats } from '../controllers/dashboardController'
import { requireAuth } from '../middleware/requireAuth'

const router = Router()

router.get('/dashboard/stats', requireAuth, getDashboardStats)

export default router
