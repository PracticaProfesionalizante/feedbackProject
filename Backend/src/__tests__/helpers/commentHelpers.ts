import { prisma } from '../../utils/prisma'

export async function createTestComment(feedbackId: string, userId: string, content = 'Comentario test') {
  return prisma.comment.create({ data: { feedbackId, userId, content } })
}
