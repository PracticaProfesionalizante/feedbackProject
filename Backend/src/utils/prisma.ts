import { PrismaClient } from '.prisma/client'
import { NODE_ENV } from '../config/constants'

type GlobalWithPrisma = typeof globalThis & {
  prisma?: PrismaClient
}

const globalForPrisma = globalThis as GlobalWithPrisma

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    engineType: 'binary',
    datasourceUrl: process.env.DATABASE_URL,
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    log: NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

if (NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
