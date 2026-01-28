import { Router } from "express"
import { authenticate } from "../middleware/auth.middleware"
import { requireAuth } from "../middleware/requireAuth"
import { feedbackController } from "../controllers/feedbackController"

const router = Router()

// Auth para todas las rutas de feedbacks
router.use(authenticate, requireAuth)

// IMPORTANT: rutas específicas antes que /:id
router.get("/recent", feedbackController.getRecent) // o .recent, elegí UNA y mantenela consistente
router.get("/", feedbackController.list)
router.get("/:id", feedbackController.getById)

router.post("/", feedbackController.create)
router.patch("/:id", feedbackController.update)
router.delete("/:id", feedbackController.remove)

export default router

