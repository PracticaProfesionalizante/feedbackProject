import { prisma } from '../../utils/prisma'

export async function resetDb() {

  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "Notification",
      "Comment",
      "Feedback",
      "TeamMember",
      "User"
    RESTART IDENTITY CASCADE;
  `)
}
