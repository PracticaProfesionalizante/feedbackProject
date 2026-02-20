/**
 * Establece relaciones entre puestos: un puesto raíz global y por área un jefe con el resto como hijos.
 * Ejecutar: npx ts-node scripts/db-set-position-hierarchy.ts
 */
import '../src/config/constants'
import { prisma } from '../src/utils/prisma'

async function main() {
  const positions = await prisma.orgPosition.findMany({
    orderBy: [{ area: { name: 'asc' } }, { name: 'asc' }],
    include: { area: { select: { id: true, name: true } } },
  })
  if (positions.length === 0) {
    console.log('No hay puestos. Nada que hacer.')
    return
  }

  const byArea = new Map<string, typeof positions>()
  for (const p of positions) {
    const list = byArea.get(p.areaId) ?? []
    list.push(p)
    byArea.set(p.areaId, list)
  }

  const areaIds = Array.from(byArea.keys()).sort()
  const globalRoot = positions[0]!
  console.log('Raíz global:', globalRoot.name, `(${globalRoot.area.name})`)

  for (const areaId of areaIds) {
    const list = byArea.get(areaId)!
    const areaHead = list[0]!
    const isGlobalRoot = areaHead.id === globalRoot.id
    if (!isGlobalRoot) {
      await prisma.orgPosition.update({
        where: { id: areaHead.id },
        data: { parentPositionId: globalRoot.id },
      })
      console.log(`  ${areaHead.name} (${areaHead.area.name}) → rinde a raíz global`)
    }
    for (let i = 1; i < list.length; i++) {
      const pos = list[i]!
      await prisma.orgPosition.update({
        where: { id: pos.id },
        data: { parentPositionId: areaHead.id },
      })
      console.log(`    ${pos.name} → rinde a ${areaHead.name}`)
    }
  }
  console.log('\nRelaciones aplicadas.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
