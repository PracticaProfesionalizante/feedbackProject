/**
 * Establece la jerarquía tipo organigrama clásico:
 * - Una sola raíz: CEO (área Dirección).
 * - Hijos directos del CEO: jefe de cada área (CMO, CTO, CFO, etc.) en horizontal.
 * - Debajo de cada jefe: el resto del área en vertical.
 * El "chief" por área es el primero definido en seed:org (mismo orden).
 * Ejecutar: npm run db:set-hierarchy
 */
import '../src/config/constants'
import { prisma } from '../src/utils/prisma'

/** Jefe de área (chief) por nombre de área - debe coincidir con el primer puesto del área en seed:org */
const CHIEF_BY_AREA: Record<string, string> = {
  'Dirección': 'CEO',
  'Académica': 'Director Académico',
  'Producto': 'Head of Product',
  'IT / Tecnología': 'CTO',
  'Marketing': 'CMO',
  'Conversión / Growth': 'Head of Growth',
  'Ventas & Alianzas': 'Head of Sales',
  'CRM & Experiencia': 'Head of CRM',
  'Soporte al Alumno': 'Community Manager',
  'Finanzas & Legal': 'CFO',
  'People / RRHH': 'Head of People',
  'Operaciones': 'Head of Operations',
  'Data & BI': 'Head of Data',
  'Seguridad & Infraestructura': 'CISO',
}

async function main() {
  const positions = await prisma.orgPosition.findMany({
    orderBy: [{ area: { name: 'asc' } }, { name: 'asc' }],
    include: { area: { select: { id: true, name: true } } },
  })
  if (positions.length === 0) {
    console.log('No hay puestos. Ejecutá antes: npm run seed:org')
    return
  }

  const byArea = new Map<string, typeof positions>()
  for (const p of positions) {
    const list = byArea.get(p.areaId) ?? []
    list.push(p)
    byArea.set(p.areaId, list)
  }

  const globalRoot = positions.find((p) => p.area.name === 'Dirección' && p.name === 'CEO') ?? positions[0]!
  console.log('Raíz (CEO):', globalRoot.name, `(${globalRoot.area.name})`)

  // CEO debe ser la única raíz: sin padre
  await prisma.orgPosition.update({
    where: { id: globalRoot.id },
    data: { parentPositionId: null },
  })
  console.log('  CEO sin padre (raíz única)')

  const areaNames = [...new Set(positions.map((p) => p.area.name))].sort()
  for (const areaName of areaNames) {
    const list = positions.filter((p) => p.area.name === areaName)
    const chiefTitle = CHIEF_BY_AREA[areaName]
    const areaHead = chiefTitle
      ? list.find((p) => p.name === chiefTitle) ?? list[0]!
      : list[0]!
    const isCeo = areaHead.id === globalRoot.id
    if (!isCeo) {
      await prisma.orgPosition.update({
        where: { id: areaHead.id },
        data: { parentPositionId: globalRoot.id },
      })
      console.log(`  ${areaHead.name} (${areaName}) → reporta a CEO`)
    }
    const rest = list.filter((p) => p.id !== areaHead.id)
    for (const pos of rest) {
      await prisma.orgPosition.update({
        where: { id: pos.id },
        data: { parentPositionId: areaHead.id },
      })
      console.log(`    ${pos.name} → reporta a ${areaHead.name}`)
    }
  }
  console.log('\nJerarquía aplicada: CEO arriba, jefes de área como hijos, resto bajo cada jefe.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
