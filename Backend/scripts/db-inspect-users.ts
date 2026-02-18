/**
 * Inspección rápida: SELECT de User y tablas relacionadas.
 * Ejecutar: npx ts-node scripts/db-inspect-users.ts
 */
import '../src/config/constants'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('=== Tabla User (campos sin password) ===\n')
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: 'asc' },
  })
  console.log(JSON.stringify(users, null, 2))
  console.log('\nTotal usuarios:', users.length)

  console.log('\n=== Tabla roles (AccessRole) ===\n')
  const roles = await prisma.accessRole.findMany({ orderBy: { name: 'asc' } })
  console.log(JSON.stringify(roles, null, 2))

  console.log('\n=== Tabla user_roles (asignación usuario <-> rol) ===\n')
  const links = await prisma.userRoleLink.findMany({
    include: {
      user: { select: { email: true, name: true } },
      role: { select: { name: true } },
    },
    orderBy: [{ userId: 'asc' }, { roleId: 'asc' }],
  })
  console.log(
    JSON.stringify(
      links.map((l) => ({ user: l.user.email, role: l.role.name })),
      null,
      2
    )
  )
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
