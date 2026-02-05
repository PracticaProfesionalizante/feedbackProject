import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';

export const getNotifications = async (req: Request, res: Response) => {
  try {
    // El user viene del token gracias al middleware 
    const userId = req.user?.id; 

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
    res.status(500).json({ message: 'Error al obtener notificaciones' });
  }
};

export const getUnreadCount = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const unreadCount = await prisma.notification.count({
      where: {
        userId,
        read: false
      }
    });

    res.json({ unreadCount });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener el contador de notificaciones no leídas' });
  }
};

export const markAsRead = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    await prisma.notification.updateMany({
      where: { id, userId },
      data: { read: true }
    });

    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ message: 'Error al marcar notificación como leída' });
  }
};

export const markAllAsRead = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    await prisma.notification.updateMany({
      where: { userId },
      data: { read: true }
    });

    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ message: 'Error al marcar todas como leídas' });
  }
};