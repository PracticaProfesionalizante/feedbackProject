import { Router } from "express";
import { getProfile } from "../controllers/user.controller";
import { authMiddleware } from "../middleware/auth.middleware"; 

const router = Router();

// Endpoint: GET /api/users/profile
router.get("/profile", authMiddleware, getProfile);
router.get("/profile", authMiddleware, getProfile);

export default router;