/*
  Warnings:

  - You are about to drop the `OnboardingProgress` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "OnboardingProgress" DROP CONSTRAINT "OnboardingProgress_domainId_fkey";

-- DropTable
DROP TABLE "OnboardingProgress";
