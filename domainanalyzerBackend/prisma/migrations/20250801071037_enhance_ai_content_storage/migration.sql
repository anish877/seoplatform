-- AlterTable
ALTER TABLE "AIQueryResult" ADD COLUMN     "domainRank" INTEGER,
ADD COLUMN     "foundDomains" TEXT,
ADD COLUMN     "modelVersion" TEXT,
ADD COLUMN     "processingTime" DOUBLE PRECISION,
ADD COLUMN     "searchQuery" TEXT;

-- CreateTable
CREATE TABLE "AIGeneratedContent" (
    "id" SERIAL NOT NULL,
    "onboardingProgressId" INTEGER NOT NULL,
    "step" INTEGER NOT NULL,
    "contentType" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIGeneratedContent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AIGeneratedContent_onboardingProgressId_step_idx" ON "AIGeneratedContent"("onboardingProgressId", "step");

-- CreateIndex
CREATE UNIQUE INDEX "AIGeneratedContent_onboardingProgressId_step_contentType_key" ON "AIGeneratedContent"("onboardingProgressId", "step", "contentType");

-- AddForeignKey
ALTER TABLE "AIGeneratedContent" ADD CONSTRAINT "AIGeneratedContent_onboardingProgressId_fkey" FOREIGN KEY ("onboardingProgressId") REFERENCES "OnboardingProgress"("id") ON DELETE CASCADE ON UPDATE CASCADE;
