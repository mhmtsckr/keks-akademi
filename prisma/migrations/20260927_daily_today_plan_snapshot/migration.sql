CREATE TABLE "DailyPlanSnapshot" (
  "id" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "dateKey" TEXT NOT NULL,
  "engineVersion" TEXT NOT NULL,
  "generationSource" TEXT NOT NULL DEFAULT 'ON_DEMAND',
  "payload" JSONB NOT NULL,
  "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "DailyPlanSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DailyPlanSnapshot_studentId_dateKey_key"
ON "DailyPlanSnapshot"("studentId", "dateKey");

CREATE INDEX "DailyPlanSnapshot_dateKey_generatedAt_idx"
ON "DailyPlanSnapshot"("dateKey", "generatedAt");

ALTER TABLE "DailyPlanSnapshot"
ADD CONSTRAINT "DailyPlanSnapshot_studentId_fkey"
FOREIGN KEY ("studentId") REFERENCES "Student"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
