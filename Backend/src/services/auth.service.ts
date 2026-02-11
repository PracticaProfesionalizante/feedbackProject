import bcrypt from 'bcrypt'
import jwt, { SignOptions } from 'jsonwebtoken'
import { AppError } from '../middleware/error.handler'
import { prisma } from '../utils/prisma'
import { JWT_SECRET, JWT_EXPIRES_IN } from '../config/constants'

export const authService = {
  async register(data: { email: string; password: string; name?: string }) {
    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    })

    if (existingUser) {
      const error = new AppError('User already exists', 409)
      throw error
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(data.password, 10)

    // Crear usuario
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name || '',
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    })

    return user
  },

  async login(email: string, password: string) {
    // Buscar usuario
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        role: true,
      },
    })

    if (!user) {
      const error = new AppError('Invalid credentials', 401)
      throw error
    }

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, user.password)

    if (!isValidPassword) {
      const error = new AppError('Invalid credentials', 401)
      throw error
    }

    // Generar JWT
    const token = jwt.sign(
      { userId: user.id },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN } as SignOptions
    )

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
    }
  },

  async me(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
      throw new AppError('User not found', 404)
    }

    return user
  },
}
