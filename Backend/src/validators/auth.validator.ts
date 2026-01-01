import { z } from 'zod'

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    // Endurecemos password a min 6 (ideal 8 en futuro, pero respetamos tu base por ahora)
    password: z.string().min(6, 'Password must be at least 6 characters'),
    // CAMBIO CRÍTICO: name es obligatorio (.min(1)) para no romper Prisma
    name: z.string().min(1, 'Name is required'),
  }),
})

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
  }),
})

export type RegisterInput = z.infer<typeof registerSchema>['body']
export type LoginInput = z.infer<typeof loginSchema>['body']