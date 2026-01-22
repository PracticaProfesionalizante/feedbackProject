import { PrismaClient } from '@prisma/client'
import { NODE_ENV } from '../config/constants'

type GlobalWithPrisma = typeof globalThis & {
  prisma?: PrismaClient
}

const globalForPrisma = globalThis as GlobalWithPrisma

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

if (NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
