import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';

// Extender la interfaz Request para incluir el usuario
interface AuthRequest extends Request {
  user?: { id: string; role: string; name: string };
}

export const getTeamMembers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    const teamMembers = await prisma.teamMember.findMany({
      where: {
        leaderId: userId,
      },
      include: {
        member: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    res.json({ teamMembers });
  } catch (error) {
    next(error);
  }
};

export const addTeamMember = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { memberId } = req.body;
    const leaderId = req.user!.id;

    if (leaderId === memberId) {
      throw new AppError("No puedes añadirte a ti mismo como miembro de tu equipo", 400);
    }

    const existingTeamMember = await prisma.teamMember.findFirst({
      where: {
        leaderId,
        memberId,
      },
    });

    if (existingTeamMember) {
      throw new AppError("Este usuario ya es miembro de tu equipo", 409);
    }

    const teamMember = await prisma.teamMember.create({
      data: {
        leaderId,
        memberId,
      },
      include: {
        member: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    res.status(201).json(teamMember);
  } catch (error) {
    next(error);
  }
};

export const removeTeamMember = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params; // id del TeamMember, no del miembro
    const leaderId = req.user!.id;

    const teamMember = await prisma.teamMember.findUnique({
      where: { id },
    });

    if (!teamMember) {
      throw new AppError("Miembro de equipo no encontrado", 404);
    }

    if (teamMember.leaderId !== leaderId) {
      throw new AppError("No tienes permiso para eliminar este miembro de equipo", 403);
    }

    await prisma.teamMember.delete({ where: { id } });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};