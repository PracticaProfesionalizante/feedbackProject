import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";
// Importamos los tipos de Zod para que TypeScript sepa qué hay en req.body
import { RegisterInput, LoginInput, UpdateProfileInput } from "../validators/auth.validator";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "secreto_super_seguro";

// REGISTRO
// Usamos los tipos <{}, {}, RegisterInput> para que TS nos ayude con el autocompletado
export const register = async (req: Request<{}, {}, RegisterInput>, res: Response) => {
  try {
    const { email, name, password, role } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "El email ya está registrado" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: role || "EMPLOYEE",
      },
    });

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: "1d" });

    res.status(201).json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch (error) {
    res.status(500).json({ message: "Error en el servidor", error });
  }
};

// LOGIN
export const login = async (req: Request<{}, {}, LoginInput>, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ message: "Credenciales inválidas" });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(401).json({ message: "Credenciales inválidas" });

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: "1d" });

    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch (error) {
    res.status(500).json({ message: "Error en el servidor", error });
  }
};

// ACTUALIZAR PERFIL
export const updateProfile = async (req: Request<{}, {}, UpdateProfileInput>, res: Response) => {
  try {
    // Ahora TS sabe qué campos pueden venir en req.body
    const { name, email, password } = req.body;
    res.json({ message: "Perfil actualizado correctamente", data: { name, email } });
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar" });
  }
};