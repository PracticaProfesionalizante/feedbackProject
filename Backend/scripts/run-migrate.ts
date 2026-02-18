/**
 * Aplica migraciones usando la URL de BD de src/config/constants.ts
 * Usa DIRECT_URL (conexión directa) para evitar timeout del advisory lock con el pooler (Supabase :6543).
 * Uso: npm run migrate:deploy
 */
import '../src/config/constants'
import { DIRECT_URL } from '../src/config/constants'
import { execSync } from 'child_process'

if (DIRECT_URL) {
  process.env.DATABASE_URL = DIRECT_URL
}
execSync('npx prisma migrate deploy', { stdio: 'inherit' })
