/**
 * Seed de la tabla roles (AccessRole).
 * Crea roles con nombres útiles para la app.
 * Ejecutar: npm run seed:roles
 */
import 'dotenv/config'
import '../src/config/constants'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const ROLES: { name: string; description: string }[] = [
  { name: 'Administrador', description: 'Acceso total a la plataforma' },
  { name: 'Líder de equipo', description: 'Gestiona equipo y feedbacks' },
  { name: 'Empleado', description: 'Usuario estándar' },
  { name: 'RRHH', description: 'Gestión de personas y organigrama' },
  { name: 'Consulta', description: 'Solo lectura' },
  { name: 'Mentor', description: 'Da feedback y acompañamiento' },
  { name: 'Editor', description: 'Puede editar contenidos' },
]

async function main() {
  for (const r of ROLES) {
    await prisma.accessRole.upsert({
      where: { name: r.name },
      update: { description: r.description },
      create: r,
    })
  }
  console.log(`Roles: ${ROLES.length} creados/actualizados`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
