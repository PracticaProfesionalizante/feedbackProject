/**
 * Actualiza la BD:
 * 1) Emails de usuarios → dominio @sociallearning.io (ej. juan.perez@sociallearning.io)
 * 2) Mitad de feedbacks con checklist, mitad sin checklist
 * Ejecutar: npx ts-node scripts/db-update-emails-and-checklist.ts
 */
import '../src/config/constants'
import { prisma } from '../src/utils/prisma'

const DOMAIN = '@sociallearning.io'

/** Nombres realistas (nombre y apellido) para reemplazar "User 1", "usuario", etc. */
const NOMBRES_REALISTAS = [
  'Juan Pérez', 'María García', 'Carlos Rodríguez', 'Ana Martínez', 'Luis Fernández',
  'Laura López', 'Diego Sánchez', 'Sofía González', 'Miguel Torres', 'Elena Ramírez',
  'Pablo Flores', 'Isabel Díaz', 'Andrés Moreno', 'Carmen Ruiz', 'Javier Hernández',
  'Rocío Jiménez', 'Fernando López', 'Patricia Martín', 'Antonio Serrano', 'Lucía Blanco',
  'Raúl Navarro', 'Marta Molina', 'Daniel Romero', 'Cristina Vargas', 'Roberto Castro',
  'Nathalie Scavuzzo', 'Ignacio Jarma', 'Valentina Ríos', 'Sebastián Mora', 'Adriana Soto',
]

function normalizeForEmail(name: string): string {
  const accentMap: Record<string, string> = {
    á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u', ñ: 'n',
    Á: 'a', É: 'e', Í: 'i', Ó: 'o', Ú: 'u', Ñ: 'n',
  }
  let s = name.trim().toLowerCase()
  for (const [k, v] of Object.entries(accentMap)) {
    s = s.replace(new RegExp(k, 'g'), v)
  }
  s = s.replace(/[^a-z0-9\s]/g, ' ')
  s = s.replace(/\s+/g, '.').replace(/\.+/g, '.').replace(/^\.|\.$/g, '')
  return s
}

function isNombreGenerico(name: string, email: string): boolean {
  const n = name.toLowerCase()
  const e = email.toLowerCase()
  return (
    /user|usuario|test|smoke|seed/.test(n) ||
    /user|usuario|test|smoke|seed/.test(e)
  )
}

async function main() {
  console.log('========== 1. Nombres y emails realistas (@sociallearning.io) ==========')
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true },
    orderBy: { createdAt: 'asc' },
  })
  const usedEmails = new Set<string>()
  let nameIndex = 0
  for (const u of users) {
    let fullName: string
    if (isNombreGenerico(u.name, u.email)) {
      fullName = NOMBRES_REALISTAS[nameIndex % NOMBRES_REALISTAS.length]!
      nameIndex++
    } else {
      fullName = u.name.trim()
    }
    let base = normalizeForEmail(fullName)
    if (!base) {
      fullName = NOMBRES_REALISTAS[nameIndex % NOMBRES_REALISTAS.length]!
      nameIndex++
      base = normalizeForEmail(fullName)
    }
    let email = `${base}${DOMAIN}`
    let n = 1
    while (usedEmails.has(email)) {
      email = `${base}${n}${DOMAIN}`
      n++
    }
    usedEmails.add(email)
    await prisma.user.update({
      where: { id: u.id },
      data: { name: fullName, email },
    })
    console.log(`  ${u.name} / ${u.email} → ${fullName} / ${email}`)
  }
  console.log(`Actualizados ${users.length} usuarios (nombre + email).\n`)

  console.log('========== 2. Feedbacks: mitad con checklist, mitad sin ==========')
  const feedbacks = await prisma.feedback.findMany({
    where: { deletedAt: null },
    select: { id: true },
    orderBy: { id: 'asc' },
  })
  if (feedbacks.length === 0) {
    console.log('No hay feedbacks. Nada que hacer.')
    return
  }
  const half = Math.ceil(feedbacks.length / 2)
  const withChecklist = feedbacks.slice(0, half)
  const withoutChecklist = feedbacks.slice(half)

  const defaultChecklistItems = [
    'Revisar objetivos del período',
    'Definir próximos pasos',
    'Cerrar acuerdos',
  ]

  const withIds = withChecklist.map((x) => x.id)
  const existingCounts = await prisma.feedbackAction.groupBy({
    by: ['feedbackId'],
    where: { feedbackId: { in: withIds } },
    _count: true,
  })
  const existingSet = new Set(existingCounts.map((e) => e.feedbackId))
  const toCreate = withIds.filter((id) => !existingSet.has(id))
  const toCreateData = toCreate.flatMap((feedbackId) =>
    defaultChecklistItems.map((text, i) => ({
      feedbackId,
      text,
      done: i === 0,
    }))
  )
  if (toCreateData.length > 0) {
    await prisma.feedbackAction.createMany({ data: toCreateData })
  }
  console.log(`  Con checklist: ${withChecklist.length} feedbacks (creados ${toCreate.length} sin checklist previo).`)

  const withoutIds = withoutChecklist.map((x) => x.id)
  const deleted = await prisma.feedbackAction.deleteMany({
    where: { feedbackId: { in: withoutIds } },
  })
  console.log(`  Sin checklist: ${withoutChecklist.length} feedbacks (eliminadas ${deleted.count} acciones).`)
  console.log('\nListo.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
