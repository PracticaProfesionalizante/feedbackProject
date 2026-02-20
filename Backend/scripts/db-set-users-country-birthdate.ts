/**
 * Rellena country y birthdate en usuarios que no los tienen.
 * Ejecutar desde Backend: npx ts-node scripts/db-set-users-country-birthdate.ts
 */
import '../src/config/constants'
import { prisma } from '../src/utils/prisma'

const PAISES = [
  'Argentina',
  'México',
  'España',
  'Colombia',
  'Chile',
  'Perú',
  'Uruguay',
  'Ecuador',
  'Venezuela',
  'Bolivia',
  'Paraguay',
  'Costa Rica',
  'Panamá',
  'Guatemala',
  'República Dominicana',
]

/** Fecha aleatoria entre minYear y maxYear (1 ene - 31 dic). */
function randomBirthdate(minYear: number, maxYear: number): Date {
  const year = minYear + Math.floor(Math.random() * (maxYear - minYear + 1))
  const month = Math.floor(Math.random() * 12)
  const day = 1 + Math.floor(Math.random() * 28) // 1-28 para evitar problemas con feb
  return new Date(year, month, day)
}

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, birthdate: true, country: true },
    orderBy: { createdAt: 'asc' },
  })

  let countryIndex = 0
  let updated = 0

  for (const u of users) {
    const updates: { country?: string; birthdate?: Date } = {}
    if (u.country == null || u.country.trim() === '') {
      updates.country = PAISES[countryIndex % PAISES.length]!
      countryIndex++
    }
    if (u.birthdate == null) {
      updates.birthdate = randomBirthdate(1980, 2000)
    }
    if (Object.keys(updates).length === 0) continue

    await prisma.user.update({
      where: { id: u.id },
      data: updates,
    })
    updated++
    const parts = []
    if (updates.country) parts.push(`país: ${updates.country}`)
    if (updates.birthdate) parts.push(`cumpleaños: ${updates.birthdate.toISOString().slice(0, 10)}`)
    console.log(`  ${u.name} (${u.email}) → ${parts.join(', ')}`)
  }

  console.log(`\nListo: ${updated} usuario(s) actualizado(s) de ${users.length} total.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
