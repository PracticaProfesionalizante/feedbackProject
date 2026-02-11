import { Router } from 'express'
import { authenticate } from '../middleware/auth.middleware'
import { userController } from '../controllers/userController'


const router = Router()

router.use(authenticate)
router.get('/profile', userController.getProfile)


export { router as userRoutes }
