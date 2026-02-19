/**
 * Aplica el fix de la columna Notification.feedbackId en la BD.
 * Ejecutar una vez con: npm run db:fix-notification
 * Requiere DIRECT_URL o DATABASE_URL en .env (usa DIRECT_URL si está definida).
 */
import 'dotenv/config'
import { Client } from 'pg'

const url = process.env.DIRECT_URL || process.env.DATABASE_URL
if (!url) {
  console.error('Falta DIRECT_URL o DATABASE_URL en el .env')
  process.exit(1)
}

async function main() {
  const client = new Client({ connectionString: url })
  try {
    await client.connect()
    console.log('Conectado. Aplicando fix Notification.feedbackId...')

    await client.query(
      `ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "feedbackId" TEXT`
    )
    console.log('  - Columna feedbackId ok')

    await client.query(
      `CREATE INDEX IF NOT EXISTS "Notification_feedbackId_idx" ON "Notification"("feedbackId")`
    )
    console.log('  - Índice ok')

    await client.query(`
      DO $$ BEGIN
        ALTER TABLE "Notification" ADD CONSTRAINT "Notification_feedbackId_fkey"
          FOREIGN KEY ("feedbackId") REFERENCES "Feedback"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$
    `)
    console.log('  - FK ok')

    console.log('Listo. La API de feedback no debería devolver 500 por esta columna.')
  } catch (e) {
    console.error('Error:', e)
    process.exit(1)
  } finally {
    await client.end()
  }
}

main()
