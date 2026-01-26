import { Request, Response } from 'express';
import { PrismaClient } from "@prisma/client"; // 1. Importamos la clase

const prisma = new PrismaClient(); // 2. Creamos la conexión

export const getNotifications = async (req: Request, res: Response) => {
  try {
    // El user viene del token gracias al middleware (asegúrate de que tu AuthRequest lo soporte,
    // si te da error en 'req.user', usa 'any' temporalmente: (req: any, ...)
    const userId = (req as any).user?.id; 

    if (!userId) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    // Buscamos las notificaciones
    const notifications = await prisma.notification.findMany({
      where: { userId: userId },
      orderBy: { createdAt: 'desc' }
    });

    res.json(notifications);
  } catch (error) {
    console.error(error); // Bueno para ver errores en consola
    res.status(500).json({ message: 'Error al obtener notificaciones' });
  }
};