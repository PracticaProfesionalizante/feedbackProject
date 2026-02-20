/**
 * Asegura que todos los usuarios tengan al menos un rol y al menos un puesto.
 * - Sin rol → se asigna el rol "default".
 * - Sin puesto → se asigna un puesto del organigrama (round-robin).
 * Ejecutar desde Backend: npm run db:assign-roles-positions
 */
import '../src/config/constants'
import { prisma } from '../src/utils/prisma'

async function main() {
  // --- 1. Roles: asegurar que existan admin y default ---
  const defaultRole = await prisma.accessRole.upsert({
    where: { name: 'default' },
    update: {},
    create: { name: 'default', description: 'Usuario estándar de la plataforma.' },
  })
  await prisma.accessRole.upsert({
    where: { name: 'admin' },
    update: {},
    create: { name: 'admin', description: 'Administrador.' },
  })

  // Usuarios sin ningún rol → asignar "default"
  const usersWithoutRoles = await prisma.user.findMany({
    where: { assignedRoles: { none: {} } },
    select: { id: true, name: true, email: true },
    orderBy: { createdAt: 'asc' },
  })

  for (const u of usersWithoutRoles) {
    await prisma.userRoleLink.upsert({
      where: { userId_roleId: { userId: u.id, roleId: defaultRole.id } },
      update: {},
      create: { userId: u.id, roleId: defaultRole.id },
    })
    console.log(`  Rol "default" → ${u.name} (${u.email})`)
  }
  console.log(`Roles: ${usersWithoutRoles.length} usuario(s) asignados a "default".\n`)

  // --- 2. Puestos: asegurar que cada usuario tenga al menos un puesto ---
  const positions = await prisma.orgPosition.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })

  if (positions.length === 0) {
    console.log('No hay puestos en el organigrama. Ejecutá antes: npm run seed:org')
    return
  }

  const usersWithoutPositions = await prisma.user.findMany({
    where: { orgPositions: { none: {} } },
    select: { id: true, name: true, email: true },
    orderBy: { createdAt: 'asc' },
  })

  let posIndex = 0
  for (const u of usersWithoutPositions) {
    const position = positions[posIndex % positions.length]!
    await prisma.userOrgPosition.upsert({
      where: {
        userId_positionId: { userId: u.id, positionId: position.id },
      },
      update: {},
      create: { userId: u.id, positionId: position.id },
    })
    console.log(`  Puesto "${position.name}" → ${u.name} (${u.email})`)
    posIndex++
  }
  console.log(`\nPuestos: ${usersWithoutPositions.length} usuario(s) con al menos un puesto asignado.`)
  console.log(`Total: ${usersWithoutRoles.length} roles + ${usersWithoutPositions.length} puestos asignados.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
