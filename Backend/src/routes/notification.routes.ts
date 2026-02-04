import { Router } from 'express';
import { getNotifications, getUnreadCount } from '../controllers/notification.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authMiddleware, getNotifications);
router.get('/count', authMiddleware, getUnreadCount);

export default router;