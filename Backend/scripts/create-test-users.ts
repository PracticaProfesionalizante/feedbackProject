/**
 * Script para crear usuarios de prueba
 * Ejecutar con: npx ts-node scripts/create-test-users.ts
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function createTestUsers() {
  const password = 'password123'
  const hashedPassword = await bcrypt.hash(password, 10)

  const users = [
    {
      email: 'leader@test.com',
      name: 'Juan Pérez',
      role: 'LEADER' as const,
      password: hashedPassword,
    },
    {
      email: 'employee1@test.com',
      name: 'María García',
      role: 'EMPLOYEE' as const,
      password: hashedPassword,
    },
    {
      email: 'employee2@test.com',
      name: 'Carlos López',
      role: 'EMPLOYEE' as const,
      password: hashedPassword,
    },
  ]

  for (const userData of users) {
    try {
      // Verificar si el usuario ya existe
      const existing = await prisma.user.findUnique({
        where: { email: userData.email },
      })

      if (existing) {
        continue
      }

      const user = await prisma.user.create({
        data: userData,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      })

    } catch (error: any) {
      console.error(`❌ Error creando usuario ${userData.email}:`, error.message)
    }
  }

}

createTestUsers()
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
