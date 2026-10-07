CREATE TABLE "UserTestimonial" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "rating" INTEGER,
  "comment" TEXT,
  "sanitizedComment" TEXT,
  "contextLabel" TEXT NOT NULL,
  "usageStartedAt" TIMESTAMP(3) NOT NULL,
  "publishConsent" BOOLEAN NOT NULL DEFAULT false,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "piiFlagged" BOOLEAN NOT NULL DEFAULT false,
  "promptedAt" TIMESTAMP(3),
  "nextPromptAt" TIMESTAMP(3),
  "submittedAt" TIMESTAMP(3),
  "publishedAt" TIMESTAMP(3),
  "consentUpdatedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "UserTestimonial_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "UserTestimonial_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "UserTestimonial_userId_key" ON "UserTestimonial"("userId");
CREATE INDEX "UserTestimonial_status_publishedAt_idx" ON "UserTestimonial"("status","publishedAt");
CREATE INDEX "UserTestimonial_role_submittedAt_idx" ON "UserTestimonial"("role","submittedAt");
