-- Ejecutar en Supabase → SQL Editor si los feedbacks devuelven 500 (P2022).
-- Añade columnas que el schema de Prisma espera y pueden faltar. Idempotente.

-- Feedback: contentEditedAt, deletedAt (suelen faltar si la tabla es vieja)
ALTER TABLE "Feedback" ADD COLUMN IF NOT EXISTS "contentEditedAt" TIMESTAMP(3);
ALTER TABLE "Feedback" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "Feedback_deletedAt_idx" ON "Feedback"("deletedAt");

-- Notification.feedbackId
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "feedbackId" TEXT;
CREATE INDEX IF NOT EXISTS "Notification_feedbackId_idx" ON "Notification"("feedbackId");
DO $$ BEGIN
  ALTER TABLE "Notification" ADD CONSTRAINT "Notification_feedbackId_fkey"
    FOREIGN KEY ("feedbackId") REFERENCES "Feedback"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
