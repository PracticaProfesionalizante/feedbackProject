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