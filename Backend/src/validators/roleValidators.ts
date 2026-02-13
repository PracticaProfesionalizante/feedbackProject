import { z } from 'zod'

export const idParamSchema = z.object({
  id: z.string().uuid(),
})

export const roleBodySchema = z.object({
  name: z.string().trim().min(2).max(50),
  description: z
    .string()
    .trim()
    .max(255)
    .optional(),
})

export const roleUpdateBodySchema = roleBodySchema.partial()

export const userIdParamSchema = z.object({
  userId: z.string().uuid(),
})

export const roleIdsBodySchema = z.object({
  roleIds: z
    .array(z.string().uuid())
    .max(50)
    .transform((arr) => Array.from(new Set(arr))), // dedup
})

export type RoleBody = z.infer<typeof roleBodySchema>
export type RoleUpdateBody = z.infer<typeof roleUpdateBodySchema>
export type RoleIdsBody = z.infer<typeof roleIdsBodySchema>
