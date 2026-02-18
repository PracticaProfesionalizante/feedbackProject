/**
 * Inspección completa de toda la base de datos.
 * Ejecutar: npx ts-node scripts/db-inspect-full.ts
 */
import '../src/config/constants'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('========== CONTEO POR TABLA ==========\n')

  // Secuencial por connection_limit=1 en la URL
  const users = await prisma.user.count()
  const roles = await prisma.accessRole.count()
  const userRoles = await prisma.userRoleLink.count()
  const teams = await prisma.teamMember.count()
  const feedbacks = await prisma.feedback.count()
  const comments = await prisma.comment.count()
  const notifications = await prisma.notification.count()
  const areas = await prisma.orgArea.count()
  const positions = await prisma.orgPosition.count()
  const userPositions = await prisma.userOrgPosition.count()
  const auditLogs = await prisma.auditLog.count()
  let actionsCount: number | string = '?'
  try {
    actionsCount = await (prisma as any).feedbackAction?.count?.() ?? 0
  } catch {
    const r = await prisma.$queryRawUnsafe<[{ count: bigint }]>('SELECT COUNT(*) as count FROM "FeedbackAction"')
    actionsCount = Number(r[0]?.count ?? 0)
  }
  console.log('User:', users)
  console.log('roles (AccessRole):', roles)
  console.log('user_roles (UserRoleLink):', userRoles)
  console.log('TeamMember:', teams)
  console.log('Feedback:', feedbacks)
  console.log('FeedbackAction:', actionsCount)
  console.log('Comment:', comments)
  console.log('Notification:', notifications)
  console.log('OrgArea:', areas)
  console.log('OrgPosition:', positions)
  console.log('UserOrgPosition:', userPositions)
  console.log('AuditLog:', auditLogs)

  console.log('\n========== ROLES (todos) ==========\n')
  const allRoles = await prisma.accessRole.findMany({ orderBy: { name: 'asc' } })
  console.log(JSON.stringify(allRoles.map((r) => ({ name: r.name, id: r.id })), null, 2))

  console.log('\n========== USER_ROLES (asignaciones) ==========\n')
  const links = await prisma.userRoleLink.findMany({
    include: { user: { select: { email: true } }, role: { select: { name: true } } },
  })
  links.forEach((l) => console.log(l.user.email, '->', l.role.name))

  console.log('\n========== ORG AREAS ==========\n')
  const areaList = await prisma.orgArea.findMany({ include: { _count: { select: { positions: true } } } })
  console.log(JSON.stringify(areaList, null, 2))

  console.log('\n========== TEAM MEMBER (muestra) ==========\n')
  const teamSample = await prisma.teamMember.findMany({
    take: 10,
    include: {
      leader: { select: { email: true } },
      member: { select: { email: true } },
    },
  })
  teamSample.forEach((t) => console.log(t.leader.email, '-> líder de ->', t.member.email))

  console.log('\n========== FEEDBACK (muestra, sin deleted) ==========\n')
  const feedbackSample = await prisma.feedback.findMany({
    where: { deletedAt: null },
    take: 5,
    select: { id: true, fromUserId: true, toUserId: true, createdAt: true },
  })
  console.log(JSON.stringify(feedbackSample, null, 2))
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
