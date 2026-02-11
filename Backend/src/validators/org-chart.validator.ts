import { z } from 'zod'

const idParamSchema = z.object({
  id: z.string().uuid('Invalid id format'),
})

const userIdParamSchema = z.object({
  userId: z.string().uuid('Invalid user id format'),
})

export const listPositionsSchema = z.object({
  query: z.object({
    areaId: z.string().uuid('Invalid area id format').optional(),
  }),
})

export const createAreaSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, 'Area name is required').max(120, 'Area name is too long'),
  }),
})

export const updateAreaSchema = z.object({
  params: idParamSchema,
  body: z.object({
    name: z.string().trim().min(1, 'Area name is required').max(120, 'Area name is too long'),
  }),
})

export const areaIdSchema = z.object({
  params: idParamSchema,
})

export const createPositionSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, 'Position name is required').max(120, 'Position name is too long'),
    areaId: z.string().uuid('Invalid area id format'),
  }),
})

export const updatePositionSchema = z.object({
  params: idParamSchema,
  body: z.object({
    name: z.string().trim().min(1, 'Position name is required').max(120, 'Position name is too long').optional(),
    areaId: z.string().uuid('Invalid area id format').optional(),
  }).refine((data) => data.name !== undefined || data.areaId !== undefined, {
    message: 'At least one field must be provided',
  }),
})

export const positionIdSchema = z.object({
  params: idParamSchema,
})

export const assignUserPositionsSchema = z.object({
  params: userIdParamSchema,
  body: z.object({
    positionIds: z.array(z.string().uuid('Invalid position id format')).max(50, 'Too many positions').default([]),
  }),
})

