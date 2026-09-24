ALTER TABLE "ParentProfile" ADD COLUMN "consentRecordedAt" TIMESTAMP(3);
ALTER TABLE "ParentProfile" ADD COLUMN "consentRecordedByUserId" TEXT;
ALTER TABLE "ParentProfile" ADD COLUMN "allowReports" BOOLEAN NOT NULL DEFAULT false;
