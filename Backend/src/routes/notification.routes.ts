import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware'
import {
  getNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../controllers/notification.controller'

const router = Router()

// Todo lo de notifications requiere auth
router.use(authMiddleware)

// GET /api/notifications?read=true|false&limit=50
router.get('/', getNotifications)

// GET /api/notifications/count
router.get('/count', getUnreadCount)

// PATCH /api/notifications/:id/read
router.patch('/:id/read', markNotificationAsRead)

// PATCH /api/notifications/read-all
router.patch('/read-all', markAllNotificationsAsRead)

export default router

