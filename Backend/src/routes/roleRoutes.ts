import { Router } from 'express'
import { authenticate } from '../middleware/auth.middleware'
import { requireAuth } from '../middleware/require.auth'
import { roleController } from '../controllers/roleController'

const router = Router()

router.use(authenticate, requireAuth)

router.get('/', roleController.list)
router.post('/', roleController.create)
router.patch('/:id', roleController.update)
router.delete('/:id', roleController.remove)

export default router
