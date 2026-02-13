/**
 * Ejecuta todos los seeds en orden: roles → usuarios + relaciones → organigrama.
 * Si se borra la data, correr: npm run seed:all
 */
import 'dotenv/config'
import '../src/config/constants'
import { execSync } from 'child_process'

const scripts = [
  { name: 'Roles', cmd: 'npx ts-node scripts/seed-roles.ts' },
  { name: 'Usuarios y tablas relacionadas', cmd: 'npx ts-node scripts/seed-data.ts' },
  { name: 'Organigrama (áreas y posiciones)', cmd: 'npx ts-node scripts/seed-org-chart.ts' },
]

function main() {
  console.log('--- Seed completo ---\n')
  for (const { name, cmd } of scripts) {
    console.log(`[${name}]`)
    execSync(cmd, { stdio: 'inherit' })
    console.log('')
  }
  console.log('--- Todo listo ---')
}

main()
