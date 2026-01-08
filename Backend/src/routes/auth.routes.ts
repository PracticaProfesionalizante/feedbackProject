import { Router } from 'express';
// Importamos las funciones nombradas directamente
import { register, login } from '../controllers/auth.controller'; 
import { validate } from '../middleware/validate.middleware';
import { loginSchema, registerSchema } from '../validators/auth.validator';

const router = Router();

// Rutas limpias y validadas
router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);

export { router as authRoutes };