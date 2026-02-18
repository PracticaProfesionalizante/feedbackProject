import { prisma } from '../../utils/prisma'

export async function createTestFeedback(fromUserId: string, toUserId: string) {
  await prisma.teamMember.create({
    data: { leaderId: fromUserId, memberId: toUserId },
  })

  return prisma.feedback.create({
    data: {
      fromUserId,
      toUserId,
      type: 'GENERAL',
      content: 'Feedback test',
    },
  })
}
