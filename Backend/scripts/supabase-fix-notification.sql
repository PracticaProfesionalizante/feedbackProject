-- Ejecutar en Supabase → SQL Editor si hay P2022 (columna no existe) en User o Feedback.
-- Añade columnas que el schema de Prisma espera y pueden faltar. Idempotente.

-- User (para /api/users/profile)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "birthdate" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "country" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "areaId" UUID;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "positionId" UUID;

-- Feedback: contentEditedAt, deletedAt (suelen faltar si la tabla es vieja)
ALTER TABLE "Feedback" ADD COLUMN IF NOT EXISTS "contentEditedAt" TIMESTAMP(3);
ALTER TABLE "Feedback" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "Feedback_deletedAt_idx" ON "Feedback"("deletedAt");

-- Tabla FeedbackAction (si no existe)
CREATE TABLE IF NOT EXISTS "FeedbackAction" (
  "id" TEXT NOT NULL,
  "feedbackId" TEXT NOT NULL,
  "text" TEXT NOT NULL,
  "done" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FeedbackAction_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "FeedbackAction_feedbackId_idx" ON "FeedbackAction"("feedbackId");
DO $$ BEGIN
  ALTER TABLE "FeedbackAction" ADD CONSTRAINT "FeedbackAction_feedbackId_fkey"
    FOREIGN KEY ("feedbackId") REFERENCES "Feedback"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Notification.feedbackId
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "feedbackId" TEXT;
CREATE INDEX IF NOT EXISTS "Notification_feedbackId_idx" ON "Notification"("feedbackId");
DO $$ BEGIN
  ALTER TABLE "Notification" ADD CONSTRAINT "Notification_feedbackId_fkey"
    FOREIGN KEY ("feedbackId") REFERENCES "Feedback"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
