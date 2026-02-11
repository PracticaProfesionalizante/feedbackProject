import { Router } from 'express'
import { Role } from '@prisma/client'
import { rolesController } from '../controllers/roles.controller'
import { authenticate } from '../middleware/auth.middleware'
import { requireAuth } from '../middleware/require.auth'
import { requireRole } from '../middleware/require.role'
import { validate } from '../middleware/validate.middleware'
import {
  assignUserRolesSchema,
  createRoleSchema,
  roleIdSchema,
  userIdSchema,
  updateRoleSchema,
} from '../validators/roles.validator'

const router = Router()

router.use(authenticate)
router.use(requireAuth)
router.use(requireRole(Role.LEADER))

router.get('/', rolesController.listRoles)
router.post('/', validate(createRoleSchema), rolesController.createRole)
router.patch('/:id', validate(updateRoleSchema), rolesController.updateRole)
router.delete('/:id', validate(roleIdSchema), rolesController.deleteRole)

router.get('/users/:userId', validate(userIdSchema), rolesController.listUserRoles)
router.put('/users/:userId', validate(assignUserRolesSchema), rolesController.replaceUserRoles)

export { router as rolesRoutes }
