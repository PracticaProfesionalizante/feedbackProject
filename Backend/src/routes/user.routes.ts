import { Router } from "express";
import { getProfile } from "../controllers/user.controller";
// import { authMiddleware } from "../middleware/auth.middleware"; 
// 👆 Descomenta esto cuando Marcos suba el middleware

const router = Router();

// Endpoint: GET /api/users/profile
// Documentación: Obtiene el perfil del usuario logueado con sus estadísticas.

// NOTA: Al no tener el middleware activo aún, esta ruta devolverá 401 (Usuario no autenticado)
// si intentas usarla ahora. ¡Esto es correcto para producción hasta tener el Auth!
// router.get("/profile", authMiddleware, getProfile);

// Usamos el controlador directo (fallará seguro por falta de user, lo cual está bien por ahora)
router.get("/profile", getProfile);

export default router;