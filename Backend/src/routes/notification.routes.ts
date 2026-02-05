import { Router } from 'express';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead
} from '../controllers/notification.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { getUnreadCountSchema } from '../validators/notification.validator';

const router = Router();

router.get('/', authMiddleware, getNotifications);
router.get('/count', authMiddleware, validate(getUnreadCountSchema), getUnreadCount);
router.patch('/:id/read', authMiddleware, markAsRead);
router.patch('/read-all', authMiddleware, markAllAsRead);

export default router;