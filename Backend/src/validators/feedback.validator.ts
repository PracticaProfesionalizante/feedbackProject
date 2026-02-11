import { z } from 'zod';
import { FeedbackType, FeedbackStatus } from '@prisma/client';

export const createFeedbackSchema = z.object({
  body: z.object({
    toUserId: z.string().uuid({ message: "ID de usuario inválido" }),
    type: z.nativeEnum(FeedbackType, { errorMap: () => ({ message: "Tipo de feedback inválido (RECOGNITION, IMPROVEMENT, GENERAL)" }) }),
    content: z.string().min(10, { message: "El contenido debe tener al menos 10 caracteres" }),
  }),
});

export const updateFeedbackSchema = z.object({
  body: z.object({
    content: z.string().min(10).optional(),
    status: z.nativeEnum(FeedbackStatus).optional(),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const updateStatusSchema = z.object({
  body: z.object({
    status: z.nativeEnum(FeedbackStatus, { 
      errorMap: () => ({ message: "Estado inválido (PENDING, IN_PROGRESS, COMPLETED)" }) 
    }),
  }),
  params: z.object({
    id: z.string().uuid({ message: "ID de feedback inválido" }),
  }),
});

export const queryFeedbackSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    type: z.enum(['sent', 'received']).optional(), // Para filtrar "mis enviados" o "mis recibidos"
    status: z.nativeEnum(FeedbackStatus).optional(),
    feedbackType: z.nativeEnum(FeedbackType).optional(),
  }),
});

export const recentFeedbacksSchema = z.object({
  query: z.object({
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  }),
});

// Schemas internos para controladores (payload ya desempaquetado, sin body/query/params wrapper).
export const idParamSchema = z.object({
  id: z.string().uuid(),
});

export const listFeedbacksQuerySchema = z.object({
  type: z.enum(['received', 'sent']).default('received'),
  status: z.nativeEnum(FeedbackStatus).optional(),
  feedbackType: z.nativeEnum(FeedbackType).optional(),
  search: z.string().min(1).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export const recentFeedbacksQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export const createFeedbackPayloadSchema = z.object({
  toUserId: z.string().uuid(),
  type: z.nativeEnum(FeedbackType),
  content: z.string().min(1).max(5000),
});

export const updateFeedbackPayloadSchema = z
  .object({
    content: z.string().min(1).max(5000).optional(),
    status: z.nativeEnum(FeedbackStatus).optional(),
  })
  .refine((data) => data.content || data.status, {
    message: 'Debes enviar al menos content o status',
  });
