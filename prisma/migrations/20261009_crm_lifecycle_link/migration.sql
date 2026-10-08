-- Non-destructive link used solely after an administrator verifies the student code.
ALTER TABLE "SalesLead"
  ADD COLUMN "studentId" TEXT;

CREATE UNIQUE INDEX "SalesLead_studentId_key" ON "SalesLead"("studentId");

ALTER TABLE "SalesLead"
  ADD CONSTRAINT "SalesLead_studentId_fkey"
  FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;
