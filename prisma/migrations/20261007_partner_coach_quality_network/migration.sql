ALTER TABLE "CoachProfile"
  ADD COLUMN "displayTitle" TEXT,
  ADD COLUMN "bio" TEXT,
  ADD COLUMN "specialties" JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN "supportedEducationLevels" JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN "maxActiveStudents" INTEGER NOT NULL DEFAULT 30,
  ADD COLUMN "acceptingStudents" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "partnerStatus" TEXT NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN "operationsStandardVersion" TEXT NOT NULL DEFAULT 'KEKS_PARTNER_V1',
  ADD COLUMN "responseTargetHours" INTEGER NOT NULL DEFAULT 24,
  ADD COLUMN "profileUpdatedAt" TIMESTAMP(3);

CREATE INDEX "CoachProfile_partnerStatus_acceptingStudents_idx"
  ON "CoachProfile"("partnerStatus", "acceptingStudents");
