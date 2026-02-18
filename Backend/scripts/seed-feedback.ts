/**
 * Pobla solo la tabla Feedback (usa usuarios existentes).
 * Ejecutar: npm run seed:feedback
 */
import 'dotenv/config'
import '../src/config/constants'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const TIPOS = ['RECOGNITION', 'IMPROVEMENT', 'GENERAL'] as const

const CONTENIDOS_RECONOCIMIENTO = [
  'Excelente trabajo en el último sprint, la entrega fue a tiempo y con buena calidad.',
  'Muy buena disposición para ayudar al equipo. Gracias por el apoyo.',
  'La presentación del proyecto quedó muy clara. Buen trabajo.',
  'Reconozco tu esfuerzo en la resolución del incidente. Muy bien.',
  'Gran iniciativa con la documentación. El equipo se beneficia mucho.',
]
const CONTENIDOS_MEJORA = [
  'Sugerencia: podríamos mejorar los tiempos de respuesta en las reuniones.',
  'Sería bueno tener más check-ins cortos durante la semana.',
  'Propongo revisar el flujo de aprobación para agilizarlo.',
  'Consideremos documentar mejor los acuerdos de las reuniones.',
  'Podemos mejorar la comunicación en el canal de proyecto.',
]
const CONTENIDOS_GENERAL = [
  'Comentario general sobre el avance del Q2. Seguimos en buen camino.',
  'Actualización del estado del proyecto: en tiempo según lo planificado.',
  'Notas de la retro: priorizar la deuda técnica el próximo sprint.',
  'Recordatorio: deadline del informe el viernes. Cualquier duda avisar.',
  'Resumen de la reunión con el cliente. Próximos pasos definidos.',
]

async function main() {
  const users = await prisma.user.findMany({ select: { id: true }, take: 50 })
  if (users.length < 2) {
    console.log('Se necesitan al menos 2 usuarios. Ejecutá antes: npm run seed:all o npm run seed')
    process.exit(1)
  }

  const count = 50
  const tipos = [...TIPOS]
  const contenidos = [...CONTENIDOS_RECONOCIMIENTO, ...CONTENIDOS_MEJORA, ...CONTENIDOS_GENERAL]

  for (let i = 0; i < count; i++) {
    const from = users[i % users.length]
    let to = users[(i + 1) % users.length]
    if (from.id === to.id) to = users[(i + 2) % users.length]!
    const type = tipos[i % tipos.length]!
    const content = contenidos[i % contenidos.length]!

    await prisma.feedback.create({
      data: {
        fromUserId: from.id,
        toUserId: to.id,
        type,
        content,
      },
    })
  }

  console.log(`Feedback: ${count} registros creados.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
