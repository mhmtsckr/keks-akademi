ALTER TABLE "QuestionBankItem"
  ADD COLUMN IF NOT EXISTS "ownerStudentId" TEXT,
  ADD COLUMN IF NOT EXISTS "imageMimeType" TEXT,
  ADD COLUMN IF NOT EXISTS "imageData" BYTEA,
  ADD COLUMN IF NOT EXISTS "classificationConfidence" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "classificationMethod" TEXT,
  ADD COLUMN IF NOT EXISTS "originalStudentAnswer" TEXT;

CREATE INDEX IF NOT EXISTS "QuestionBankItem_ownerStudentId_createdAt_idx"
  ON "QuestionBankItem"("ownerStudentId","createdAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'QuestionBankItem_ownerStudentId_fkey'
  ) THEN
    ALTER TABLE "QuestionBankItem"
      ADD CONSTRAINT "QuestionBankItem_ownerStudentId_fkey"
      FOREIGN KEY ("ownerStudentId") REFERENCES "Student"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
