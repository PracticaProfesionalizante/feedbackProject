import { Router } from 'express';
import { createComment, deleteComment, getComments } from '../controllers/commentController';
import { authMiddleware } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { createCommentSchema, deleteCommentSchema, getCommentsSchema } from '../validators/comment.validator';

const router = Router();

// Todas las rutas de comentarios requieren autenticación
router.use(authMiddleware);

// 1. GET /api/feedbacks/:feedbackId/comments (Listar comentarios de un feedback)
router.get('/feedbacks/:feedbackId/comments', validate(getCommentsSchema), getComments);

// 2. POST /api/comments (Crear comentario)
router.post('/comments', validate(createCommentSchema), createComment);

// 3. DELETE /api/comments/:id (Eliminar comentario)
router.delete('/comments/:id', validate(deleteCommentSchema), deleteComment);

export default router;
