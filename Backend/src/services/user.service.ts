import { prisma } from '../utils/prisma';

// 1. Obtener datos básicos del usuario (Sin password)
export const findUserById = async (userId: string) => {
  return await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      // ⛔ PASSWORD EXCLUIDO POR SEGURIDAD
    },
  });
};

// 2. Calcular estadísticas (Feedbacks y Comentarios)
export const getUserStats = async (userId: string) => {
  // Contar feedbacks que el usuario ESCRIBIÓ (excluir soft-deleted)
  const feedbacksGiven = await prisma.feedback.count({
    where: { fromUserId: userId, deletedAt: null },
  });

  // Contar feedbacks que el usuario RECIBIÓ (excluir soft-deleted)
  const feedbacksReceived = await prisma.feedback.count({
    where: { toUserId: userId, deletedAt: null },
  });

  // Contar comentarios que el usuario hizo (excluir soft-deleted)
  const comments = await prisma.comment.count({
    where: { userId: userId, deletedAt: null },
  });

  return {
    feedbacksGiven,
    feedbacksReceived,
    comments,
  };
};

// 3. Calcular información de equipo
export const getTeamInfo = async (userId: string) => {
  // Si soy líder, ¿cuántos empleados tengo a cargo?
  const employeesCount = await prisma.teamMember.count({
    where: { leaderId: userId },
  });

  // Si soy empleado, ¿cuántos líderes tengo?
  const leadersCount = await prisma.teamMember.count({
    where: { memberId: userId },
  });

  return {
    employeesCount,
    leadersCount,
  };
};