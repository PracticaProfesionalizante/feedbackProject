import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const analyticsService = {
  // -----------------------------------
  // FEEDBACKS POR MES (ÚLTIMOS 6)
  // -----------------------------------
  async getFeedbacksByMonth(userId: string) {
    return prisma.$queryRaw<
      { month: Date; count: number }[]
    >`
      SELECT 
        DATE_TRUNC('month', "createdAt") AS month,
        COUNT(*)::int AS count
      FROM "Feedback"
      WHERE "toUserId" = ${userId}
      GROUP BY month
      ORDER BY month DESC
      LIMIT 6
    `
  },

  // -----------------------------------
  // PROMEDIO DE TIEMPO PARA COMPLETAR
  // -----------------------------------
  async getAvgCompletionTime(userId: string) {
    const result = await prisma.$queryRaw<
      { avg_days: number | null }[]
    >`
      SELECT 
        AVG(EXTRACT(EPOCH FROM ("updatedAt" - "createdAt"))) / 86400 AS avg_days
      FROM "Feedback"
      WHERE "toUserId" = ${userId}
      AND "status" = 'COMPLETED'
    `

    return result[0]?.avg_days ?? 0
  },

  // -----------------------------------
  // TOP COLABORADORES
  // -----------------------------------
  async getTopCollaborators(userId: string) {
    return prisma.$queryRaw<
      { id: string; name: string; email: string; feedback_count: number }[]
    >`
      SELECT 
        u.id,
        u.name,
        u.email,
        COUNT(*)::int AS feedback_count
      FROM "Feedback" f
      JOIN "User" u ON (
        (f."toUserId" = ${userId} AND f."fromUserId" = u.id)
        OR
        (f."fromUserId" = ${userId} AND f."toUserId" = u.id)
      )
      WHERE u.id != ${userId}
      GROUP BY u.id, u.name, u.email
      ORDER BY feedback_count DESC
      LIMIT 5
    `
  },

  // -----------------------------------
  // TASA DE COMPLETITUD (%)
  // -----------------------------------
  async getCompletionRate(userId: string) {
    const [total, completed] = await Promise.all([
      prisma.feedback.count({
        where: { toUserId: userId }
      }),
      prisma.feedback.count({
        where: {
          toUserId: userId,
          status: 'COMPLETED'
        }
      })
    ])

    if (total === 0) return 0

    return Math.round((completed / total) * 100)
  }
}

