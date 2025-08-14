/*
  Warnings:

  - A unique constraint covering the columns `[domainId]` on the table `OnboardingProgress` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "OnboardingProgress_domainId_key" ON "OnboardingProgress"("domainId");
