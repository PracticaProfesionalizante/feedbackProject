import { Router } from 'express'
import { authenticate } from '../middleware/auth.middleware'
import { requireAuth } from '../middleware/require.auth'
import { userController } from '../controllers/userController'

const router = Router()

router.use(authenticate)
router.get('/profile', requireAuth, userController.getProfile)
router.patch('/profile', requireAuth, userController.updateProfile)

export { router as userRoutes }
