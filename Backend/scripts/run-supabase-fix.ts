/**
 * Aplica en la BD las columnas que el schema de Prisma espera y que pueden faltar en Supabase.
 * Ejecutar una vez con: npm run db:fix-notification
 * Usa la URL definida en src/config/constants.ts (DIRECT_URL).
 */
import { DIRECT_URL } from '../src/config/constants'
import { Client } from 'pg'

const url = DIRECT_URL
if (!url) {
  console.error('Falta DIRECT_URL en src/config/constants.ts')
  process.exit(1)
}

async function main() {
  const client = new Client({ connectionString: url })
  try {
    await client.connect()
    console.log('Conectado. Aplicando fixes...')

    // --- Feedback: columnas que suelen faltar si la tabla se creó con un schema viejo
    await client.query(
      `ALTER TABLE "Feedback" ADD COLUMN IF NOT EXISTS "contentEditedAt" TIMESTAMP(3)`
    )
    await client.query(
      `ALTER TABLE "Feedback" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3)`
    )
    console.log('  - Feedback.contentEditedAt y deletedAt ok')

    await client.query(
      `CREATE INDEX IF NOT EXISTS "Feedback_deletedAt_idx" ON "Feedback"("deletedAt")`
    )
    console.log('  - Índice Feedback.deletedAt ok')

    // --- Notification.feedbackId (para notificaciones por feedback)
    await client.query(
      `ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "feedbackId" TEXT`
    )
    await client.query(
      `CREATE INDEX IF NOT EXISTS "Notification_feedbackId_idx" ON "Notification"("feedbackId")`
    )
    await client.query(`
      DO $$ BEGIN
        ALTER TABLE "Notification" ADD CONSTRAINT "Notification_feedbackId_fkey"
          FOREIGN KEY ("feedbackId") REFERENCES "Feedback"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$
    `)
    console.log('  - Notification.feedbackId ok')

    console.log('Listo. Probá de nuevo GET /api/feedbacks/recent.')
  } catch (e) {
    console.error('Error:', e)
    process.exit(1)
  } finally {
    await client.end()
  }
}

main()
