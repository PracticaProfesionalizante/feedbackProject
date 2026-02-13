/**
 * Aplica migraciones usando la URL de BD de src/config/constants.ts
 * Uso: npm run migrate:deploy
 */
import '../src/config/constants'
import { execSync } from 'child_process'
execSync('npx prisma migrate deploy', { stdio: 'inherit' })
