import { Router } from 'express';
import { 
  createFeedback, 
  getFeedbacks, 
  getFeedbackById, 
  updateFeedback,
  updateStatus,
  deleteFeedback 
} from '../controllers/feedback.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { 
  createFeedbackSchema, 
  updateFeedbackSchema,
  updateStatusSchema,
  queryFeedbackSchema 
} from '../validators/feedback.validator';

const router = Router();

// Todas las rutas requieren login
router.use(authMiddleware);

// 1. GET /api/feedbacks (Listar con filtros)
router.get('/', validate(queryFeedbackSchema), getFeedbacks);

// 2. GET /api/feedbacks/:id (Detalle)
router.get('/:id', getFeedbackById);

// 3. POST /api/feedbacks (Crear)
router.post('/', validate(createFeedbackSchema), createFeedback);

// 4. PATCH /api/feedbacks/:id/status (Cambiar estado - debe ir antes de /:id)
router.patch('/:id/status', validate(updateStatusSchema), updateStatus);

// 5. PATCH /api/feedbacks/:id (Actualizar)
router.patch('/:id', validate(updateFeedbackSchema), updateFeedback);

// 6. DELETE /api/feedbacks/:id (Eliminar)
router.delete('/:id', deleteFeedback);

export default router;