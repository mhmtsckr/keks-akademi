ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "accessKeyExpiresAt" TIMESTAMP(3);
UPDATE "Student" SET "accessKeyExpiresAt" = "createdAt" + INTERVAL '1 year' WHERE "accessKeyExpiresAt" IS NULL;
ALTER TABLE "Student" ALTER COLUMN "accessKeyExpiresAt" SET NOT NULL;
