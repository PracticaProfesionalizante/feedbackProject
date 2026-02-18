/**
 * Script para poblar la base de datos con datos de prueba.
 * Usuarios: contraseña Password123
 * Pobla todas las tablas que existan en la BD (20 registros por tabla).
 * Ejecutar: npm run seed
 */
import 'dotenv/config'
import '../src/config/constants'
import bcrypt from 'bcrypt'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient() as PrismaClient & {
  accessRole: { findMany: (args?: object) => Promise<{ id: string }[]> }
  userRoleLink: { upsert: (args: object) => Promise<unknown> }
  orgArea: { upsert: (args: object) => Promise<{ id: string }>; findMany: () => Promise<{ id: string }[]> }
  orgPosition: { upsert: (args: object) => Promise<{ id: string }>; findMany: () => Promise<{ id: string }[]> }
  userOrgPosition: { upsert: (args: object) => Promise<unknown> }
}

const SEED_PASSWORD = 'Password123'
const SALT_ROUNDS = 10
const N = 20

function isTableMissing(e: unknown): boolean {
  const err = e as { code?: string }
  return err?.code === 'P2021' || (typeof err?.code === 'string' && err.code.startsWith('P20'))
}

async function main() {
  const hashedPassword = await bcrypt.hash(SEED_PASSWORD, SALT_ROUNDS)

  // 1. Users (20)
  const userPayloads = Array.from({ length: N }, (_, i) => {
    const n = i + 1
    return {
      email: `user${n}@seed.com`,
      name: `Usuario ${n}`,
      role: n <= 5 ? ('LEADER' as const) : ('EMPLOYEE' as const),
      password: hashedPassword,
    }
  })
  const users: { id: string }[] = []
  for (const u of userPayloads) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role, password: hashedPassword },
      create: u,
    })
    users.push(user)
  }
  console.log(`Users: ${users.length}`)

  // 2. UserRoleLink (user_roles): asigna usuarios a roles existentes (creados por seed:roles)
  let roles: { id: string }[] = []
  try {
    roles = await prisma.accessRole.findMany({ select: { id: true }, orderBy: { name: 'asc' } })
    if (roles.length > 0) {
      for (let i = 0; i < N; i++) {
        const roleId = roles[i % roles.length].id
        await prisma.userRoleLink.upsert({
          where: {
            userId_roleId: { userId: users[i].id, roleId },
          },
          update: {},
          create: { userId: users[i].id, roleId },
        })
      }
      console.log(`UserRoleLink: ${N} (${roles.length} roles en BD)`)
    } else {
      console.log('UserRoleLink: omitido (ejecutá antes npm run seed:roles)')
    }
  } catch (e) {
    if (isTableMissing(e)) console.log('UserRoleLink: tabla no existe, omitido')
    else throw e
  }

  // 4. OrgArea - 20
  let areas: { id: string }[] = []
  try {
    const areaPayloads = Array.from({ length: N }, (_, i) => ({
      name: `Área ${i + 1}`,
    }))
    for (const a of areaPayloads) {
      const area = await prisma.orgArea.upsert({
        where: { name: a.name },
        update: {},
        create: a,
      })
      areas.push(area)
    }
    console.log(`OrgArea: ${areas.length}`)
  } catch (e) {
    if (isTableMissing(e)) console.log('OrgArea: tabla no existe, omitido')
    else throw e
  }

  // 5. OrgPosition - 20 (una por área)
  let positions: { id: string }[] = []
  if (areas.length === N) {
    try {
      const positionPayloads = Array.from({ length: N }, (_, i) => ({
        name: `Posición ${i + 1}`,
        areaId: areas[i].id,
      }))
      for (const p of positionPayloads) {
        const pos = await prisma.orgPosition.upsert({
          where: { areaId_name: { areaId: p.areaId, name: p.name } },
          update: {},
          create: p,
        })
        positions.push(pos)
      }
      console.log(`OrgPosition: ${positions.length}`)
    } catch (e) {
      if (isTableMissing(e)) console.log('OrgPosition: tabla no existe, omitido')
      else throw e
    }
  }

  // 6. UserOrgPosition - 20
  if (positions.length === N) {
    try {
      for (let i = 0; i < N; i++) {
        await prisma.userOrgPosition.upsert({
          where: {
            userId_positionId: { userId: users[i].id, positionId: positions[i].id },
          },
          update: {},
          create: {
            userId: users[i].id,
            positionId: positions[i].id,
          },
        })
      }
      console.log(`UserOrgPosition: ${N}`)
    } catch (e) {
      if (isTableMissing(e)) console.log('UserOrgPosition: tabla no existe, omitido')
      else throw e
    }
  }

  // 7. TeamMember - 20
  try {
    const leaders = users.slice(0, 5)
    const members = users.slice(5, N)
    let tmCount = 0
    for (let L = 0; L < leaders.length && tmCount < N; L++) {
      for (let M = 0; M < 4 && tmCount < N; M++) {
        const memberIdx = (L * 4 + M) % members.length
        await prisma.teamMember.upsert({
          where: {
            leaderId_memberId: {
              leaderId: leaders[L].id,
              memberId: members[memberIdx].id,
            },
          },
          update: {},
          create: {
            leaderId: leaders[L].id,
            memberId: members[memberIdx].id,
          },
        })
        tmCount++
      }
    }
    console.log(`TeamMember: ${tmCount}`)
  } catch (e) {
    if (isTableMissing(e)) console.log('TeamMember: tabla no existe, omitido')
    else throw e
  }

  // 8. Feedback - 20
  let feedbacks: { id: string }[] = []
  try {
    for (let i = 0; i < N; i++) {
      const from = users[i % users.length]
      const to = users[(i + 1) % users.length]
      if (from.id === to.id) continue
      const fb = await prisma.feedback.create({
        data: {
          fromUserId: from.id,
          toUserId: to.id,
          content: `Feedback de prueba ${i + 1} de ${from.id.slice(0, 8)} a ${to.id.slice(0, 8)}.`,
        },
      })
      feedbacks.push(fb)
    }
    console.log(`Feedback: ${feedbacks.length}`)
  } catch (e) {
    if (isTableMissing(e)) console.log('Feedback: tabla no existe, omitido')
    else throw e
  }

  // 9. Comment - 20
  if (feedbacks.length >= N) {
    try {
      for (let i = 0; i < N; i++) {
        await prisma.comment.create({
          data: {
            feedbackId: feedbacks[i].id,
            userId: users[i].id,
            content: `Comentario de prueba ${i + 1} en el feedback.`,
          },
        })
      }
      console.log(`Comment: ${N}`)
    } catch (e) {
      if (isTableMissing(e)) console.log('Comment: tabla no existe, omitido')
      else throw e
    }
  } else if (feedbacks.length > 0) {
    try {
      for (let i = 0; i < Math.min(N, feedbacks.length); i++) {
        await prisma.comment.create({
          data: {
            feedbackId: feedbacks[i].id,
            userId: users[i].id,
            content: `Comentario de prueba ${i + 1}.`,
          },
        })
      }
      console.log(`Comment: ${Math.min(N, feedbacks.length)}`)
    } catch (e) {
      if (isTableMissing(e)) console.log('Comment: tabla no existe, omitido')
      else throw e
    }
  }

  // 10. Notification - 20
  try {
    const notifTypes = ['FEEDBACK_RECEIVED', 'COMMENT_RECEIVED', 'FEEDBACK_UPDATED'] as const
    for (let i = 0; i < N; i++) {
      await prisma.notification.create({
        data: {
          userId: users[i].id,
          type: notifTypes[i % 3],
          message: `Notificación de prueba ${i + 1} para Usuario ${i + 1}.`,
          read: i % 3 === 0,
        },
      })
    }
    console.log(`Notification: ${N}`)
  } catch (e) {
    if (isTableMissing(e)) console.log('Notification: tabla no existe, omitido')
    else throw e
  }

  console.log('---')
  console.log('Seed completado. Usuarios: user1@seed.com ... user20@seed.com, contraseña: ' + SEED_PASSWORD)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
