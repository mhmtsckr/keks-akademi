ALTER TABLE "PracticeLog" ADD COLUMN "taskSubmissionId" TEXT;
CREATE UNIQUE INDEX "PracticeLog_taskSubmissionId_key" ON "PracticeLog"("taskSubmissionId");
ALTER TABLE "TaskSubmission" ADD COLUMN "errorReason" TEXT;
