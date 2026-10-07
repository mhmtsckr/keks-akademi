-- KEKS production compatibility schema.
-- The production database predates Prisma migration tracking.
-- This file is intentionally additive and idempotent: no DROP, TRUNCATE, RENAME or destructive rewrites.

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

CREATE TABLE IF NOT EXISTS "UserTestimonial" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "rating" INTEGER,
  "comment" TEXT,
  "sanitizedComment" TEXT,
  "contextLabel" TEXT NOT NULL,
  "usageStartedAt" TIMESTAMP(3) NOT NULL,
  "publishConsent" BOOLEAN NOT NULL DEFAULT false,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "piiFlagged" BOOLEAN NOT NULL DEFAULT false,
  "promptedAt" TIMESTAMP(3),
  "nextPromptAt" TIMESTAMP(3),
  "submittedAt" TIMESTAMP(3),
  "publishedAt" TIMESTAMP(3),
  "consentUpdatedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserTestimonial_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "UserTestimonial_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "UserTestimonial_userId_key"
  ON "UserTestimonial"("userId");
CREATE INDEX IF NOT EXISTS "UserTestimonial_status_publishedAt_idx"
  ON "UserTestimonial"("status","publishedAt");
CREATE INDEX IF NOT EXISTS "UserTestimonial_role_submittedAt_idx"
  ON "UserTestimonial"("role","submittedAt");
