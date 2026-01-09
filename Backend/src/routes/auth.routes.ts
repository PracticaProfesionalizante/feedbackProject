import { Router } from 'express';
import { register, login, updateProfile } from '../controllers/auth.controller'; // Asumiendo que creas updateProfile
import { validate } from '../middleware/validate.middleware';
import { 
    loginSchema, 
    registerSchema, 
    updateProfileSchema 
} from '../validators/auth.validator';

const router = Router();

// 1. Registro
router.post('/register', validate(registerSchema), register);

// 2. Login
router.post('/login', validate(loginSchema), login);

// 3. Actualizar Perfil (Suele ser PATCH o PUT)
// El validate(updateProfileSchema) asegura que si mandan datos, sean válidos.
router.patch('/profile', validate(updateProfileSchema), updateProfile);

export { router as authRoutes };