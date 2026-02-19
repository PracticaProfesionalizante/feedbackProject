-- Ejecutar en Supabase → SQL Editor si los feedbacks devuelven 500 (P2022)
-- por columna faltante en Notification. Es idempotente: se puede ejecutar más de una vez.

-- Columna feedbackId en Notification
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "feedbackId" TEXT;

-- Índice
CREATE INDEX IF NOT EXISTS "Notification_feedbackId_idx" ON "Notification"("feedbackId");

-- FK a Feedback (ignora si ya existe)
DO $$ BEGIN
  ALTER TABLE "Notification" ADD CONSTRAINT "Notification_feedbackId_fkey"
    FOREIGN KEY ("feedbackId") REFERENCES "Feedback"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
