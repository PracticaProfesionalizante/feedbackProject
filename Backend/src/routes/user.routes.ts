import { Router } from 'express'
import { authenticate } from '../middleware/auth.middleware'
import { requireAuth } from '../middleware/require.auth'
import { userController } from '../controllers/user.controller'

const router = Router()

router.use(authenticate)
router.get('/profile', requireAuth, userController.getProfile)

export { router as userRoutes }
