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

    // --- User: columnas que el schema espera y pueden faltar (evita P2022 en /api/users/profile)
    await client.query(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "birthdate" TIMESTAMP(3)`)
    await client.query(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "country" TEXT`)
    await client.query(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP`)
    await client.query(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP`)
    await client.query(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "areaId" UUID`)
    await client.query(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "positionId" UUID`)
    console.log('  - User: birthdate, country, createdAt, updatedAt, areaId, positionId ok')

    // --- Feedback: quitar columnas viejas (type, status) que ya no están en el schema
    await client.query(`ALTER TABLE "Feedback" DROP COLUMN IF EXISTS "type"`)
    await client.query(`ALTER TABLE "Feedback" DROP COLUMN IF EXISTS "status"`)
    console.log('  - Feedback: columnas type y status eliminadas (si existían)')

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

    // --- Tabla FeedbackAction (si no existe)
    await client.query(`
      CREATE TABLE IF NOT EXISTS "FeedbackAction" (
        "id" TEXT NOT NULL,
        "feedbackId" TEXT NOT NULL,
        "text" TEXT NOT NULL,
        "done" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "FeedbackAction_pkey" PRIMARY KEY ("id")
      )
    `)
    await client.query(
      `CREATE INDEX IF NOT EXISTS "FeedbackAction_feedbackId_idx" ON "FeedbackAction"("feedbackId")`
    )
    await client.query(`
      DO $$ BEGIN
        ALTER TABLE "FeedbackAction" ADD CONSTRAINT "FeedbackAction_feedbackId_fkey"
          FOREIGN KEY ("feedbackId") REFERENCES "Feedback"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$
    `)
    console.log('  - Tabla FeedbackAction ok')

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
