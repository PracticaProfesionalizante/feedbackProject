import { z } from 'zod'

export const toggleActionParamsSchema = z.object({
  id: z.string().uuid(),        // feedbackId
  actionId: z.string().uuid(),  // actionId
})

export const toggleActionBodySchema = z.object({
  done: z.boolean(),
})