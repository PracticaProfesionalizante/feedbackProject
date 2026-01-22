import { Router } from 'express'
import { authenticate } from '../middleware/auth.middleware'
import { requireAuth} from '../middleware/requireAuth'
import { authMiddleware } from '../middleware/auth.middleware'
import { feedbackController } from '../controllers/feedbackController'

const router = Router()

router.use(authenticate, requireAuth)

router.get('/recent', authMiddleware, feedbackController.getRecent)
router.get('/:id', authMiddleware, feedbackController.getById)
router.get('/', feedbackController.list)
router.get('/:id', feedbackController.getById)
router.post('/', feedbackController.create)
router.patch('/:id', feedbackController.update)
router.delete('/:id', feedbackController.remove)

export default router
