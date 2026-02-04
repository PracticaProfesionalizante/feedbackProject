import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { addTeamMember, getTeamMembers, removeTeamMember } from '../controllers/team.controller';
// Importar validadores (asumo que existen o se crearán)
import { validate } from '../middleware/validate.middleware';
import { addTeamMemberSchema, removeTeamMemberSchema } from '../validators/team.validator';

const router = Router();

// Todas las rutas de equipo requieren autenticación
router.use(authMiddleware);

// GET /api/team (Listar miembros del equipo)
router.get('/', getTeamMembers);

// POST /api/team (Añadir miembro al equipo)
router.post('/', validate(addTeamMemberSchema), addTeamMember);

// DELETE /api/team/:id (Eliminar miembro del equipo)
router.delete('/:id', validate(removeTeamMemberSchema), removeTeamMember);

export default router;