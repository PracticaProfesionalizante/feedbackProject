import { Router } from 'express'
import {
  feedbackController,
  getRecentFeedbacks,
  getCounterparts,
} from '../controllers/feedbackController'
import { feedbackActionController } from '../controllers/feedbackActionController'
import { authenticate } from '../middleware/auth.middleware'
import { requireAuth } from '../middleware/require.auth'
import { validate } from '../middleware/validate.middleware'
import {
  createFeedbackSchema,
  updateFeedbackSchema,
  queryFeedbackSchema,
  recentFeedbacksSchema,
  toggleActionSchema,
} from '../validators/feedback.validator'

const router = Router()

// Todas las rutas requieren login real + userId resuelto.
router.use(authenticate, requireAuth)

// GET /api/feedbacks/recent
router.get('/recent', validate(recentFeedbacksSchema), getRecentFeedbacks)

// GET /api/feedbacks/counterparts (debe ir antes de /:id)
router.get('/counterparts', getCounterparts)

// GET /api/feedbacks
router.get('/', validate(queryFeedbackSchema), feedbackController.list)

// GET /api/feedbacks/:id
router.get('/:id', feedbackController.getById)

// POST /api/feedbacks
router.post('/', validate(createFeedbackSchema), feedbackController.create)

// ✅ NUEVO: Toggle de checklist
// Debe ir ANTES de /:id/status y /:id si agregáramos rutas más genéricas.
// En tu caso, como incluye /actions/:actionId no pisa, pero lo dejamos ordenado.
router.patch(
  '/:id/actions/:actionId',
  validate(toggleActionSchema),
  feedbackController.toggleAction
)

// PATCH /api/feedbacks/:id
router.patch('/:id', validate(updateFeedbackSchema), feedbackController.update)

// DELETE /api/feedbacks/:id
router.delete('/:id', feedbackController.remove)

export default router
