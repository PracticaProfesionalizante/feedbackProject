import { z } from 'zod'

const idParamSchema = z.object({
  id: z.string().uuid('Invalid id format'),
})

const userIdParamSchema = z.object({
  userId: z.string().uuid('Invalid user id format'),
})

export const roleIdSchema = z.object({
  params: idParamSchema,
})

export const userIdSchema = z.object({
  params: userIdParamSchema,
})

export const createRoleSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, 'Role name is required').max(120, 'Role name is too long'),
    description: z.string().trim().max(500, 'Description is too long').optional(),
  }),
})

export const updateRoleSchema = z.object({
  params: idParamSchema,
  body: z
    .object({
      name: z.string().trim().min(1, 'Role name is required').max(120, 'Role name is too long').optional(),
      description: z.string().trim().max(500, 'Description is too long').nullable().optional(),
    })
    .refine((data) => data.name !== undefined || data.description !== undefined, {
      message: 'At least one field must be provided',
    }),
})

export const assignUserRolesSchema = z.object({
  params: userIdParamSchema,
  body: z.object({
    roleIds: z.array(z.string().uuid('Invalid role id format')).max(100, 'Too many roles').default([]),
  }),
})
