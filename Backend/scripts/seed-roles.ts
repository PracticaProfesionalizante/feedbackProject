/**
 * Seed de la tabla roles (AccessRole).
 * Solo dos roles en la empresa: admin y default.
 * Ejecutar: npm run seed:roles
 */
import 'dotenv/config'
import '../src/config/constants'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const ROLES: { name: string; description: string }[] = [
  { name: 'admin', description: 'Administrador. Acceso a gestión de roles y configuración.' },
  { name: 'default', description: 'Usuario estándar de la plataforma.' },
]

async function main() {
  const created: string[] = []
  for (const r of ROLES) {
    await prisma.accessRole.upsert({
      where: { name: r.name },
      update: { description: r.description },
      create: r,
    })
    created.push(r.name)
  }
  console.log(`Roles creados/actualizados: ${created.join(', ')}`)

  // Asignar rol "default" a todos los usuarios que no tengan ningún rol
  const defaultRole = await prisma.accessRole.findUnique({ where: { name: 'default' }, select: { id: true } })
  if (defaultRole) {
    const usersWithoutRoles = await prisma.user.findMany({
      where: {
        assignedRoles: { none: {} },
      },
      select: { id: true },
    })
    for (const u of usersWithoutRoles) {
      await prisma.userRoleLink.upsert({
        where: {
          userId_roleId: { userId: u.id, roleId: defaultRole.id },
        },
        update: {},
        create: { userId: u.id, roleId: defaultRole.id },
      })
    }
    if (usersWithoutRoles.length > 0) {
      console.log(`${usersWithoutRoles.length} usuario(s) asignados al rol "default".`)
    }
  }

  // Si ningún usuario tiene rol "admin", asignarlo al primer usuario (para tener al menos un admin)
  const adminRole = await prisma.accessRole.findUnique({ where: { name: 'admin' }, select: { id: true } })
  if (adminRole) {
    const anyAdmin = await prisma.userRoleLink.findFirst({
      where: { roleId: adminRole.id },
      select: { userId: true },
    })
    if (!anyAdmin) {
      const firstUser = await prisma.user.findFirst({ orderBy: { createdAt: 'asc' }, select: { id: true } })
      if (firstUser) {
        await prisma.userRoleLink.upsert({
          where: {
            userId_roleId: { userId: firstUser.id, roleId: adminRole.id },
          },
          update: {},
          create: { userId: firstUser.id, roleId: adminRole.id },
        })
        console.log('Un usuario ha sido asignado al rol "admin" (primer usuario).')
      }
    }
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
