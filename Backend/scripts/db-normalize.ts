/**
 * Normaliza la base de datos:
 * - Solo dos roles: admin y default. Elimina el resto.
 * - user_roles: cada usuario con al menos "default"; quien tenía Administrador/Líder/admin/RRHH → también "admin".
 * - Elimina columna User.role si existe (LEADER/EMPLOYEE).
 * Ejecutar: npx ts-node scripts/db-normalize.ts
 */
import '../src/config/constants'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const ADMIN_ROLE_NAME = 'admin'
const DEFAULT_ROLE_NAME = 'default'
const ROLES_TO_MAP_TO_ADMIN = ['admin', 'Administrador', 'Líder de equipo', 'RRHH']

async function main() {
  console.log('========== 1. Eliminar columna User.role si existe ==========')
  try {
    await prisma.$executeRawUnsafe('ALTER TABLE "User" DROP COLUMN IF EXISTS "role"')
    console.log('Columna role eliminada (o no existía).')
  } catch (e) {
    console.log('Nota:', (e as Error).message)
  }
  try {
    await prisma.$executeRawUnsafe('DROP TYPE IF EXISTS "Role"')
    console.log('Tipo Role eliminado (o no existía).')
  } catch (e) {
    console.log('Nota:', (e as Error).message)
  }

  console.log('\n========== 2. Obtener asignaciones actuales (quién tenía rol "admin-like") ==========')
  const links = await prisma.userRoleLink.findMany({
    include: { user: { select: { id: true } }, role: { select: { name: true } } },
  })
  const userIdsToAssignAdmin = new Set<string>()
  for (const l of links) {
    if (ROLES_TO_MAP_TO_ADMIN.includes(l.role.name)) {
      userIdsToAssignAdmin.add(l.user.id)
    }
  }
  console.log('Usuarios que tendrán rol admin:', userIdsToAssignAdmin.size)

  console.log('\n========== 3. Asegurar que existan roles admin y default ==========')
  const adminRole = await prisma.accessRole.upsert({
    where: { name: ADMIN_ROLE_NAME },
    update: { description: 'Administrador. Acceso a gestión de roles y configuración.' },
    create: {
      name: ADMIN_ROLE_NAME,
      description: 'Administrador. Acceso a gestión de roles y configuración.',
    },
  })
  const defaultRole = await prisma.accessRole.upsert({
    where: { name: DEFAULT_ROLE_NAME },
    update: { description: 'Usuario estándar de la plataforma.' },
    create: {
      name: DEFAULT_ROLE_NAME,
      description: 'Usuario estándar de la plataforma.',
    },
  })
  console.log('admin id:', adminRole.id, '| default id:', defaultRole.id)

  console.log('\n========== 4. Borrar todas las asignaciones user_roles ==========')
  const deleted = await prisma.userRoleLink.deleteMany({})
  console.log('Eliminadas', deleted.count, 'asignaciones.')

  console.log('\n========== 5. Borrar roles que no sean admin ni default ==========')
  const rolesToDelete = await prisma.accessRole.findMany({
    where: { name: { notIn: [ADMIN_ROLE_NAME, DEFAULT_ROLE_NAME] } },
    select: { id: true, name: true },
  })
  for (const r of rolesToDelete) {
    await prisma.accessRole.delete({ where: { id: r.id } })
    console.log('Eliminado rol:', r.name)
  }

  console.log('\n========== 6. Asignar a cada usuario al menos "default" ==========')
  const allUsers = await prisma.user.findMany({ select: { id: true } })
  for (const u of allUsers) {
    await prisma.userRoleLink.upsert({
      where: {
        userId_roleId: { userId: u.id, roleId: defaultRole.id },
      },
      update: {},
      create: { userId: u.id, roleId: defaultRole.id },
    })
  }
  console.log(allUsers.length, 'usuarios con rol default.')

  console.log('\n========== 7. Asignar "admin" a quienes corresponda ==========')
  for (const userId of userIdsToAssignAdmin) {
    await prisma.userRoleLink.upsert({
      where: {
        userId_roleId: { userId, roleId: adminRole.id },
      },
      update: {},
      create: { userId, roleId: adminRole.id },
    })
  }
  console.log(userIdsToAssignAdmin.size, 'usuarios con rol admin.')

  console.log('\n========== 8. Garantizar al menos un admin ==========')
  const anyAdmin = await prisma.userRoleLink.findFirst({
    where: { roleId: adminRole.id },
    select: { userId: true },
  })
  if (!anyAdmin) {
    const firstUser = await prisma.user.findFirst({
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    })
    if (firstUser) {
      await prisma.userRoleLink.create({
        data: { userId: firstUser.id, roleId: adminRole.id },
      })
      console.log('Asignado admin al primer usuario (no había ningún admin).')
    }
  } else {
    console.log('Ya existe al menos un admin.')
  }

  console.log('\n========== 9. Resumen final ==========')
  const totalRoles = await prisma.accessRole.count()
  const totalLinks = await prisma.userRoleLink.count()
  const rolesList = await prisma.accessRole.findMany({ select: { name: true } })
  console.log('Total roles:', totalRoles, rolesList.map((r) => r.name))
  console.log('Total user_roles:', totalLinks)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
