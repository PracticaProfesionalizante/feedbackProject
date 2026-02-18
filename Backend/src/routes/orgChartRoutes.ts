import { Router } from 'express'
import { orgChartController } from '../controllers/orgChartController'
import { authenticate } from '../middleware/auth.middleware'
import { requireAuth } from '../middleware/require.auth'
import { requireAdmin } from '../middleware/require.admin'
import { validate } from '../middleware/validate.middleware'
import {
  areaIdSchema,
  assignUserPositionsSchema,
  createAreaSchema,
  createPositionSchema,
  listPositionsSchema,
  positionIdSchema,
  updateAreaSchema,
  updatePositionSchema,
} from '../validators/org-chart.validator'

const router = Router()

router.use(authenticate)
router.use(requireAuth)
router.use(requireAdmin)

router.get('/areas', orgChartController.listAreas)
router.post('/areas', validate(createAreaSchema), orgChartController.createArea)
router.patch('/areas/:id', validate(updateAreaSchema), orgChartController.updateArea)
router.delete('/areas/:id', validate(areaIdSchema), orgChartController.deleteArea)

router.get('/positions', validate(listPositionsSchema), orgChartController.listPositions)
router.post('/positions', validate(createPositionSchema), orgChartController.createPosition)
router.patch('/positions/:id', validate(updatePositionSchema), orgChartController.updatePosition)
router.delete('/positions/:id', validate(positionIdSchema), orgChartController.deletePosition)

router.get('/users/:userId/positions', validate(assignUserPositionsSchema), orgChartController.listUserPositions)
router.put('/users/:userId/positions', validate(assignUserPositionsSchema), orgChartController.replaceUserPositions)

export { router as orgChartRoutes }
