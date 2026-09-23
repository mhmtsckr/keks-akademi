CREATE TABLE "CoachAccessCode" (
  "id" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "codeHash" TEXT NOT NULL,
  "codeHint" TEXT NOT NULL,
  "codeCiphertext" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt" TIMESTAMP(3),
  "claimedByCoachId" TEXT,
  "assessmentId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "CoachAccessCode_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CoachAccessCode_codeHash_key" ON "CoachAccessCode"("codeHash");
CREATE INDEX "CoachAccessCode_studentId_active_idx" ON "CoachAccessCode"("studentId", "active");
CREATE INDEX "CoachAccessCode_claimedByCoachId_createdAt_idx" ON "CoachAccessCode"("claimedByCoachId", "createdAt");

ALTER TABLE "CoachAccessCode"
ADD CONSTRAINT "CoachAccessCode_studentId_fkey"
FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CoachAccessCode"
ADD CONSTRAINT "CoachAccessCode_claimedByCoachId_fkey"
FOREIGN KEY ("claimedByCoachId") REFERENCES "CoachProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
