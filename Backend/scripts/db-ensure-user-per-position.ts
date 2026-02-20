/**
 * Asegura que cada puesto del organigrama tenga al menos 1 usuario asignado.
 * Si un puesto no tiene usuarios, se crea un usuario nuevo (rol default) y se asigna.
 * Ejecutar desde Backend: npm run db:ensure-user-per-position
 */
import '../src/config/constants'
import bcrypt from 'bcrypt'
import { prisma } from '../src/utils/prisma'

const SALT_ROUNDS = 10
const DEFAULT_PASSWORD = 'Password123'
const EMAIL_DOMAIN = '@sociallearning.io'

function slugForEmail(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.|\.$/g, '')
}

async function main() {
  const defaultRole = await prisma.accessRole.findUnique({
    where: { name: 'default' },
    select: { id: true },
  })
  if (!defaultRole) {
    console.log('No existe el rol "default". Ejecutá antes: npm run seed:roles')
    return
  }

  const positions = await prisma.orgPosition.findMany({
    orderBy: [{ area: { name: 'asc' } }, { name: 'asc' }],
    include: {
      area: { select: { id: true, name: true } },
      _count: { select: { userLinks: true } },
    },
  })

  const positionsWithoutUser = positions.filter((p) => p._count.userLinks === 0)
  if (positionsWithoutUser.length === 0) {
    console.log('Todos los puestos tienen al menos un usuario asignado.')
    return
  }

  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS)
  const existingEmails = new Set(
    (await prisma.user.findMany({ select: { email: true } })).map((u) => u.email)
  )

  let created = 0
  for (const pos of positionsWithoutUser) {
    const base = slugForEmail(pos.name) || 'usuario'
    let email = `${base}${EMAIL_DOMAIN}`
    let n = 1
    while (existingEmails.has(email)) {
      email = `${base}.${n}${EMAIL_DOMAIN}`
      n++
    }
    existingEmails.add(email)

    const name = `Usuario ${pos.name}`

    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        country: 'Argentina',
        birthdate: new Date(1990, 0, 1),
      },
      select: { id: true },
    })

    await prisma.userRoleLink.create({
      data: { userId: user.id, roleId: defaultRole.id },
    })

    await prisma.userOrgPosition.create({
      data: { userId: user.id, positionId: pos.id },
    })

    created++
    console.log(`  ${pos.area.name} / ${pos.name} → usuario creado: ${name} (${email})`)
  }

  console.log(`\nListo: ${created} usuario(s) creado(s) y asignado(s) a puestos que no tenían ninguno.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
