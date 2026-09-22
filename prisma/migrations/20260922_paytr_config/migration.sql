CREATE TABLE IF NOT EXISTS "PaytrConfig" (
  "id" TEXT NOT NULL,
  "merchantId" TEXT NOT NULL,
  "merchantKeyCiphertext" TEXT NOT NULL,
  "merchantSaltCiphertext" TEXT NOT NULL,
  "testMode" BOOLEAN NOT NULL DEFAULT true,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PaytrConfig_pkey" PRIMARY KEY ("id")
);
