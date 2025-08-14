-- CreateTable
CREATE TABLE "OnboardingProgress" (
    "id" SERIAL NOT NULL,
    "domainId" INTEGER NOT NULL,
    "currentStep" INTEGER NOT NULL DEFAULT 0,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "stepData" JSONB,
    "lastActivity" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OnboardingProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OnboardingProgress_domainId_key" ON "OnboardingProgress"("domainId");

-- CreateIndex
CREATE INDEX "OnboardingProgress_domainId_idx" ON "OnboardingProgress"("domainId");

-- CreateIndex
CREATE INDEX "OnboardingProgress_isCompleted_idx" ON "OnboardingProgress"("isCompleted");

-- CreateIndex
CREATE INDEX "OnboardingProgress_lastActivity_idx" ON "OnboardingProgress"("lastActivity");

-- AddForeignKey
ALTER TABLE "OnboardingProgress" ADD CONSTRAINT "OnboardingProgress_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE CASCADE ON UPDATE CASCADE;
