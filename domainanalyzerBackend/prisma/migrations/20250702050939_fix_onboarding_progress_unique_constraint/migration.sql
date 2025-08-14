/*
  Warnings:

  - A unique constraint covering the columns `[domainId,domainVersionId]` on the table `OnboardingProgress` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "OnboardingProgress_domainId_key";

-- CreateIndex
CREATE UNIQUE INDEX "OnboardingProgress_domainId_domainVersionId_key" ON "OnboardingProgress"("domainId", "domainVersionId");
