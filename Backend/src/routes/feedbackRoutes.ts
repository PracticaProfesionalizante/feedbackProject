import { Router } from 'express'
import { authenticate } from '../middleware/auth.middleware'
import { requireAuth } from '../middleware/requireAuth'
import { feedbackController } from '../controllers/feedbackController'

const router = Router()

router.use(authenticate, requireAuth)

router.get('/', feedbackController.list)
router.get('/:id', feedbackController.getById)
router.post('/', feedbackController.create)
router.patch('/:id', feedbackController.update)
router.delete('/:id', feedbackController.remove)

export default router
