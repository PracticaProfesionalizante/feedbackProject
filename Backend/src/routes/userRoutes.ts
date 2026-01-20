import { Router } from 'express'
import { userController } from '../controllers/userController'
import { requireAuth } from '../middleware/requireAuth'
import { requireRole } from '../middleware/requireRole'

const router = Router()

router.get('/profile', requireAuth, userController.getProfile)

export default router