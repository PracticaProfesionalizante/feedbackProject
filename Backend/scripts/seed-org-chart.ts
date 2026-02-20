/**
 * Seed de áreas y posiciones del organigrama (tablas OrgArea y OrgPosition).
 * El código del backend usa solo OrgArea y OrgPosition; no usa Area ni Position.
 * Ejecutar: npm run seed:org
 */
import 'dotenv/config'
import '../src/config/constants'
import { prisma } from '../src/utils/prisma'

const STRUCTURE: { area: string; positions: string[] }[] = [
  { area: 'Dirección', positions: ['CEO', 'COO'] },
  {
    area: 'Académica',
    positions: ['Director Académico', 'Líder de Contenidos', 'Instructional Designer', 'Mentores / Coaches'],
  },
  {
    area: 'Producto',
    positions: ['Head of Product', 'Product Owner', 'UX/UI Designer'],
  },
  {
    area: 'IT / Tecnología',
    positions: [
      'CTO',
      'Tech Lead',
      'Frontend Developer',
      'Backend Developer',
      'QA / Testing',
      'DevOps',
    ],
  },
  {
    area: 'Marketing',
    positions: ['CMO', 'Content Marketing', 'Brand & Comunicación', 'Paid Media'],
  },
  {
    area: 'Conversión / Growth',
    positions: [
      'Head of Growth',
      'Performance Marketing',
      'CRO (Conversion Rate Optimization)',
      'Analytics',
    ],
  },
  {
    area: 'Ventas & Alianzas',
    positions: ['Head of Sales', 'Account Executive', 'Partnerships'],
  },
  {
    area: 'CRM & Experiencia',
    positions: ['Head of CRM', 'CRM Manager', 'Customer Success'],
  },
  {
    area: 'Soporte al Alumno',
    positions: ['Community Manager'],
  },
  {
    area: 'Finanzas & Legal',
    positions: ['CFO', 'Contabilidad', 'Tesorería', 'Legal / Compliance'],
  },
  {
    area: 'People / RRHH',
    positions: ['Head of People', 'Recruitment', 'People Development', 'Performance & Cultura'],
  },
  // Extras para empresa grande
  {
    area: 'Operaciones',
    positions: ['Head of Operations', 'Project Manager', 'Operations Coordinator'],
  },
  {
    area: 'Data & BI',
    positions: ['Head of Data', 'Data Engineer', 'Business Intelligence Analyst', 'Data Scientist'],
  },
  {
    area: 'Seguridad & Infraestructura',
    positions: ['CISO', 'Security Engineer', 'Cloud Architect', 'SRE'],
  },
]

async function main() {
  for (const { area: areaName, positions } of STRUCTURE) {
    const area = await prisma.orgArea.upsert({
      where: { name: areaName },
      update: {},
      create: { name: areaName },
    })

    for (const posName of positions) {
      await prisma.orgPosition.upsert({
        where: {
          areaId_name: { areaId: area.id, name: posName },
        },
        update: {},
        create: { name: posName, areaId: area.id },
      })
    }
    console.log(`Área "${areaName}": ${positions.length} posiciones`)
  }

  const areaCount = await prisma.orgArea.count()
  const positionCount = await prisma.orgPosition.count()
  console.log('---')
  console.log(`Listo: ${areaCount} áreas, ${positionCount} posiciones (tablas OrgArea y OrgPosition)`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
