import { z } from 'zod'

const idParamSchema = z.object({
  id: z.string().uuid('Invalid id format'),
})

const userIdParamSchema = z.object({
  userId: z.string().uuid('Invalid user id format'),
})

export const listUsersSchema = z.object({
  query: z.object({
    search: z.string().max(100).optional().default(''),
  }).optional().default({}),
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
    parentPositionId: z.string().uuid('Invalid parent position id').nullable().optional(),
  }),
})

export const updatePositionSchema = z.object({
  params: idParamSchema,
  body: z.object({
    name: z.string().trim().min(1, 'Position name is required').max(120, 'Position name is too long').optional(),
    areaId: z.string().uuid('Invalid area id format').optional(),
    parentPositionId: z.string().uuid('Invalid parent position id').nullable().optional(),
  }).refine(
    (data) => data.name !== undefined || data.areaId !== undefined || data.parentPositionId !== undefined,
    { message: 'At least one field must be provided' }
  ),
})

export const positionIdSchema = z.object({
  params: idParamSchema,
})

/** Solo params (GET lista de puestos del usuario) */
export const listUserPositionsSchema = z.object({
  params: userIdParamSchema,
})

/** Params + body con positionIds (PUT reemplazar puestos del usuario) */
export const assignUserPositionsSchema = z.object({
  params: userIdParamSchema,
  body: z.object({
    positionIds: z.array(z.string().uuid('Invalid position id format')).max(50, 'Too many positions').default([]),
  }),
})


