ALTER TABLE "Assessment" ADD COLUMN "scoringVersion" TEXT NOT NULL DEFAULT 'legacy-unspecified';
ALTER TABLE "Assessment" ADD COLUMN "reportVersion" TEXT NOT NULL DEFAULT 'legacy-unspecified';
