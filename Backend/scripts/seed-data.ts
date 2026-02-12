/**
 * Script para poblar la base de datos con usuarios de prueba.
 * Contraseña de todos: Password123
 * Ejecutar: npm run seed
 * Usa la URL de BD definida en src/config/constants.ts si no hay .env
 */
import 'dotenv/config'
import '../src/config/constants' // define process.env.DATABASE_URL desde constants
import bcrypt from 'bcrypt'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const SEED_PASSWORD = 'Password123'
const SALT_ROUNDS = 10

async function main() {
  const hashedPassword = await bcrypt.hash(SEED_PASSWORD, SALT_ROUNDS)

  const usersToCreate = Array.from({ length: 15 }, (_, i) => {
    const n = i + 1
    return {
      email: `user${n}@seed.com`,
      name: `Usuario ${n}`,
      role: n <= 3 ? ('LEADER' as const) : ('EMPLOYEE' as const),
      password: hashedPassword,
    }
  })

  for (const u of usersToCreate) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role, password: hashedPassword },
      create: u,
    })
  }

  console.log(`Listo: ${usersToCreate.length} usuarios creados/actualizados.`)
  console.log('Emails: user1@seed.com ... user15@seed.com')
  console.log('Contraseña: ' + SEED_PASSWORD)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
