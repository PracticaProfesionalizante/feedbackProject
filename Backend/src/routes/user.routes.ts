import { Router } from 'express'
import { authenticate } from '../middleware/auth.middleware'
import { userController } from '../controllers/user.controller'

const router = Router()

router.use(authenticate)
router.get('/profile', userController.profile)

export { router as userRoutes }
