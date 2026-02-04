import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { getDashboardStats } from '../controllers/dashboard.controller';

const router = Router();

// Todas las rutas de dashboard requieren autenticación
router.use(authMiddleware);

// GET /api/dashboard (Obtener estadísticas del dashboard)
router.get('/', getDashboardStats);

export default router;