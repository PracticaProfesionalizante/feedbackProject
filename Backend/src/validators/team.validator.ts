import { z } from 'zod';

export const addTeamMemberSchema = z.object({
  body: z.object({
    memberId: z.string().uuid({ message: "ID de miembro inválido" }),
  }),
});

export const removeTeamMemberSchema = z.object({
  params: z.object({
    id: z.string().uuid({ message: "ID de TeamMember inválido" }),
  }),
});