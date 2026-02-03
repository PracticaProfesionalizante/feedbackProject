import { Router } from 'express';
import { getNotifications, getUnreadCount } from '../controllers/notification.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware'; // Importar validate
import { getUnreadCountSchema } from '../validators/notification.validator'; // Importar el validador

const router = Router();

router.get('/', authMiddleware, getNotifications);
router.get('/count', authMiddleware, validate(getUnreadCountSchema), getUnreadCount);

export default router;