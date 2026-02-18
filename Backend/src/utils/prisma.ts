import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { NODE_ENV } from '../config/constants' // también ejecuta setupEnvironment() y deja DATABASE_URL en process.env

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL is not set. Set it in .env or in the environment.')
}

const adapter = new PrismaPg({ connectionString })

type GlobalWithPrisma = typeof globalThis & {
  prisma?: PrismaClient
}

const globalForPrisma = globalThis as GlobalWithPrisma

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

if (NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
