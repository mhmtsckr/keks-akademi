ALTER TABLE "PracticeLog"
ADD COLUMN "durationSeconds" INTEGER,
ADD COLUMN "questionType" TEXT,
ADD COLUMN "problemType" TEXT,
ADD COLUMN "metricPayload" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN "masteryScore" DOUBLE PRECISION,
ADD COLUMN "masteryState" TEXT NOT NULL DEFAULT 'NEW';

CREATE INDEX "PracticeLog_studentId_examType_subject_topic_date_idx"
ON "PracticeLog"("studentId","examType","subject","topic","date");
