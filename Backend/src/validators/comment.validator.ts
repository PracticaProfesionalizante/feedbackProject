import { z } from 'zod';

export const createCommentSchema = z.object({
  body: z.object({
    feedbackId: z.string().uuid({ message: "ID de feedback inválido" }),
    content: z.string().min(1, { message: "El comentario no puede estar vacío" }),
  }),
});

export const deleteCommentSchema = z.object({
  params: z.object({
    id: z.string().uuid({ message: "ID de comentario inválido" }),
  }),
});

export const getCommentsSchema = z.object({
  params: z.object({
    feedbackId: z.string().uuid({ message: "ID de feedback inválido" }),
  }),
});
