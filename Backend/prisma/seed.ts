import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seeding...')

  // 1. Limpiar base de datos (Orden inverso a las dependencias)
  // Borramos primero las relaciones, luego los usuarios
  await prisma.teamMember.deleteMany()
  await prisma.comment.deleteMany()
  await prisma.feedback.deleteMany()
  await prisma.user.deleteMany()

  console.log('🧹 Base de datos limpia.')

  // Password común para todos: "123456"
  const hashedPassword = await bcrypt.hash('123456', 10)

  // 2. Crear Usuarios (Nodos de la jerarquía)
  
  // A. El Gran Jefe (CEO)
  const ceo = await prisma.user.create({
    data: {
      email: 'ceo@empresa.com',
      name: 'Roberto CEO',
      password: hashedPassword,
      role: Role.LEADER,
    },
  })

  // B. El Gerente (Líder intermedio)
  const manager = await prisma.user.create({
    data: {
      email: 'manager@empresa.com',
      name: 'Ana Manager',
      password: hashedPassword,
      role: Role.LEADER,
    },
  })

  // C. Empleado 1
  const dev1 = await prisma.user.create({
    data: {
      email: 'dev1@empresa.com',
      name: 'Carlos Developer',
      password: hashedPassword,
      role: Role.EMPLOYEE,
    },
  })

  // D. Empleado 2
  const dev2 = await prisma.user.create({
    data: {
      email: 'dev2@empresa.com',
      name: 'Lucía Frontend',
      password: hashedPassword,
      role: Role.EMPLOYEE,
    },
  })

  console.log('👥 Usuarios creados.')

  // 3. Crear Relaciones (Aristas de la jerarquía)

  // Escenario 1: El CEO lidera al Manager (Jerarquía vertical)
  await prisma.teamMember.create({
    data: {
      leaderId: ceo.id,
      memberId: manager.id,
    },
  })

  // Escenario 2: El Manager lidera a los dos Devs
  await prisma.teamMember.createMany({
    data: [
      { leaderId: manager.id, memberId: dev1.id },
      { leaderId: manager.id, memberId: dev2.id },
    ],
  })

  // Escenario 3: El CEO TAMBIÉN lidera directamente a Dev1 (Matriz / Proyecto especial)
  // Esto demuestra que un empleado (dev1) puede tener múltiples líderes (Manager y CEO)
  await prisma.teamMember.create({
    data: {
      leaderId: ceo.id,
      memberId: dev1.id,
    },
  })

  console.log(`
  ✅ Seeding completado con éxito:
  - CEO es jefe de Manager y Dev1
  - Manager es jefe de Dev1 y Dev2
  - Dev1 tiene 2 jefes (CEO y Manager)
  `)
}

main()
  .catch((e) => {
    console.error('❌ Error en seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })