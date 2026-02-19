/**
 * Crea 20 feedbacks nuevos por cada usuario (cada uno como autor).
 * Ejecutar: npm run seed:feedback-20
 */
import { prisma } from '../src/utils/prisma'

const CONTENIDOS = [
  'Excelente trabajo en el último sprint, la entrega fue a tiempo y con buena calidad.',
  'Muy buena disposición para ayudar al equipo. Gracias por el apoyo.',
  'La presentación del proyecto quedó muy clara. Buen trabajo.',
  'Reconozco tu esfuerzo en la resolución del incidente. Muy bien.',
  'Gran iniciativa con la documentación. El equipo se beneficia mucho.',
  'Sugerencia: podríamos mejorar los tiempos de respuesta en las reuniones.',
  'Sería bueno tener más check-ins cortos durante la semana.',
  'Propongo revisar el flujo de aprobación para agilizarlo.',
  'Consideremos documentar mejor los acuerdos de las reuniones.',
  'Podemos mejorar la comunicación en el canal de proyecto.',
  'Comentario general sobre el avance del Q2. Seguimos en buen camino.',
  'Actualización del estado del proyecto: en tiempo según lo planificado.',
  'Notas de la retro: priorizar la deuda técnica el próximo sprint.',
  'Recordatorio: deadline del informe el viernes. Cualquier duda avisar.',
  'Resumen de la reunión con el cliente. Próximos pasos definidos.',
  'Buen desempeño en la capacitación del equipo. Muy claro.',
  'Agradezco el seguimiento del tema pendiente. Todo resuelto.',
  'Propuesta interesante para el próximo trimestre. A revisar.',
  'Feedback positivo del cliente sobre la última entrega.',
  'Seguimos así con la coordinación entre áreas.',
]

function pickOther(users: { id: string }[], fromId: string, index: number): { id: string } {
  const others = users.filter((u) => u.id !== fromId)
  if (others.length === 0) throw new Error('Se necesita al menos otro usuario')
  return others[index % others.length]!
}

async function main() {
  const users = await prisma.user.findMany({ select: { id: true } })
  if (users.length < 2) {
    console.log('Se necesitan al menos 2 usuarios en la BD.')
    process.exit(1)
  }

  const FEEDBACKS_PER_USER = 20
  let created = 0

  for (const from of users) {
    for (let k = 0; k < FEEDBACKS_PER_USER; k++) {
      const to = pickOther(users, from.id, created + k)
      const content = CONTENIDOS[(created + k) % CONTENIDOS.length]!
      await prisma.feedback.create({
        data: {
          fromUserId: from.id,
          toUserId: to.id,
          content,
        },
      })
    }
    created += FEEDBACKS_PER_USER
    console.log(`Usuario ${from.id.slice(0, 8)}…: ${FEEDBACKS_PER_USER} feedbacks creados.`)
  }

  console.log(`Total: ${created} feedbacks creados (${users.length} usuarios × ${FEEDBACKS_PER_USER}).`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect().catch(() => {}))
