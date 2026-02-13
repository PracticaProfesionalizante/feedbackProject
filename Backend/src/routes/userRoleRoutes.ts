import { Router } from 'express'
import { authenticate } from '../middleware/auth.middleware'
import { requireAuth } from '../middleware/require.auth'
import { userRoleController } from '../controllers/userRoleController'

const router = Router()

router.use(authenticate, requireAuth)

router.get('/:userId/roles', userRoleController.getUserRoles)
router.put('/:userId/roles', userRoleController.replaceUserRoles)

export default router
