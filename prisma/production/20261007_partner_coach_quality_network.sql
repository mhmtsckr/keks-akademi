-- Production compatibility migration for the legacy KEKS database.
-- The production schema predates Prisma migration tracking, so this script is intentionally
-- idempotent and additive. It must never drop, rename, or rewrite existing columns.

ALTER TABLE "CoachProfile"
  ADD COLUMN IF NOT EXISTS "displayTitle" TEXT,
  ADD COLUMN IF NOT EXISTS "bio" TEXT,
  ADD COLUMN IF NOT EXISTS "specialties" JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS "supportedEducationLevels" JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS "maxActiveStudents" INTEGER NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS "acceptingStudents" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "partnerStatus" TEXT NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN IF NOT EXISTS "operationsStandardVersion" TEXT NOT NULL DEFAULT 'KEKS_PARTNER_V1',
  ADD COLUMN IF NOT EXISTS "responseTargetHours" INTEGER NOT NULL DEFAULT 24,
  ADD COLUMN IF NOT EXISTS "profileUpdatedAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "CoachProfile_partnerStatus_acceptingStudents_idx"
  ON "CoachProfile"("partnerStatus", "acceptingStudents");
