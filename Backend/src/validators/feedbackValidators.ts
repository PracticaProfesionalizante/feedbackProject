import { z } from 'zod'
import { FeedbackStatus, FeedbackType } from '@prisma/client'

export const idParamSchema = z.object({
  id: z.string().uuid(),
})

export const listFeedbacksQuerySchema = z.object({
  type: z.enum(['received', 'sent']).default('received'),
  status: z.nativeEnum(FeedbackStatus).optional(),
  feedbackType: z.nativeEnum(FeedbackType).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
})

export const recentFeedbacksQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(10),
})

export const createFeedbackSchema = z.object({
  toUserId: z.string().uuid(),
  type: z.nativeEnum(FeedbackType),
  content: z.string().min(1).max(5000),
})

export const updateFeedbackSchema = z
  .object({
    content: z.string().min(1).max(5000).optional(),
    status: z.nativeEnum(FeedbackStatus).optional(),
  })
  .refine((data) => data.content || data.status, {
    message: 'Debes enviar al menos content o status',
  })