import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  name: z.string().min(3, 'Name must be at least 3 characters').max(100),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100),
  role: z.enum(['LEADER', 'EMPLOYEE']).optional()
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

// Update Profile Schema
export const updateProfileSchema = z.object({
  name: z.string().min(3).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional()
});

// Al final de src/validators/auth.validator.ts
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;