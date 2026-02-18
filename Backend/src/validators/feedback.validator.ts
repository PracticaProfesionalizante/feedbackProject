import { z } from 'zod'

/**
 * ✅ NUEVO: schema reutilizable para acciones checklist
 * Motivo: la nueva lógica agrega "Acciones" (checklist) al feedback.
 * - text: requerido, sin HTML/imagenes (eso se valida mejor en UI; acá solo tamaño/trim)
 */
const actionCreateSchema = z.object({
  text: z.string().trim().min(1, { message: 'El texto de la acción es requerido' }).max(300),
})

/**
 * ✅ NUEVO: schema para update de acciones
 * - id es opcional: si viene, el backend puede intentar preservar `done`
 *   (cuando reemplaza acciones, usa el id previo para mapear done).
 */
const actionUpdateSchema = z.object({
  id: z.string().uuid().optional(),
  text: z.string().trim().min(1).max(300),
})

/**
 * ✅ NUEVO: toggle schema para actualizar done (check/uncheck)
 * Motivo: el receptor NO puede editar contenido ni texto de acciones,
 * solo puede cambiar el estado done.
 */
export const toggleActionSchema = z.object({
  body: z.object({
    done: z.boolean(),
  }),
  params: z.object({
    id: z.string().uuid({ message: 'ID de feedback inválido' }),
    actionId: z.string().uuid({ message: 'ID de acción inválido' }),
  }),
})

export const createFeedbackSchema = z.object({
  body: z.object({
    toUserId: z.string().uuid({ message: 'ID de usuario inválido' }),
    content: z.string().min(10, { message: 'El contenido debe tener al menos 10 caracteres' }),
    actions: z.array(actionCreateSchema).max(50).optional(),
  }),
})

export const updateFeedbackSchema = z.object({
  body: z.object({
    content: z.string().min(10).optional(),

    /**
     * actions opcional para que el AUTOR edite estructura/texto
     */
    actions: z.array(actionUpdateSchema).max(50).optional(),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
})

// Acepta string o number (por si el proxy/entorno parsea query)
const queryPageLimit = z.union([z.string().regex(/^\d+$/), z.number()]).transform(Number).optional()

export const queryFeedbackSchema = z.object({
  query: z.object({
    page: queryPageLimit,
    limit: queryPageLimit,
    type: z.enum(['sent', 'received']).optional(),
  }),
})

export const recentFeedbacksSchema = z.object({
  query: z.object({
    limit: queryPageLimit,
  }),
})

// Schemas internos para controladores (payload ya desempaquetado, sin body/query/params wrapper).
export const idParamSchema = z.object({
  id: z.string().uuid(),
})

export const listFeedbacksQuerySchema = z.object({
  type: z.enum(['received', 'sent']).default('received'),
  search: z.string().min(1).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
})

export const recentFeedbacksQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(10),
})

export const createFeedbackPayloadSchema = z.object({
  toUserId: z.string().uuid(),
  content: z.string().min(1).max(5000),
  actions: z.array(actionCreateSchema).max(50).optional(),
})

export const updateFeedbackPayloadSchema = z
  .object({
    content: z.string().min(1).max(5000).optional(),
    actions: z.array(actionUpdateSchema).max(50).optional(),
  })
  .refine((data) => data.content || data.actions, {
    message: 'Debes enviar al menos content o actions',
  })