import { Request, Response } from "express";
import { findUserById, getUserStats, getTeamInfo } from "../services/user.service";

export const getProfile = async (req: Request, res: Response) => {
  try {
    // Obtenemos el ID del usuario "inyectado" por el middleware
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Usuario no autenticado" });
    }

    // 1️⃣ Buscamos al usuario
    const user = await findUserById(userId);
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // 2️⃣ Buscamos las estadísticas en paralelo (para que sea rápido)
    const stats = await getUserStats(userId);
    
    // 3️⃣ Buscamos la info del equipo
    const teamInfo = await getTeamInfo(userId);

    // 4️⃣ Armamos la respuesta final combinando todo
    const finalResponse = {
      ...user,    // id, name, email, role...
      stats,      // Objeto con counts
      teamInfo    // Objeto con info de equipo
    };

    res.json(finalResponse);

  } catch (error) {
    console.error("Error en getProfile:", error);
    res.status(500).json({ message: "Error al obtener perfil", error });
  }
};