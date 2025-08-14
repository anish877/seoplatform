/*
  Warnings:

  - You are about to drop the column `isActive` on the `DomainVersion` table. All the data in the column will be lost.
  - You are about to drop the `users` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[term,domainId,domainVersionId]` on the table `Keyword` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[domainId,domainVersionId]` on the table `OnboardingProgress` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "CompetitorAnalysis" DROP CONSTRAINT "CompetitorAnalysis_domainVersionId_fkey";

-- DropForeignKey
ALTER TABLE "CrawlResult" DROP CONSTRAINT "CrawlResult_domainVersionId_fkey";

-- DropForeignKey
ALTER TABLE "DashboardAnalysis" DROP CONSTRAINT "DashboardAnalysis_domainVersionId_fkey";

-- DropForeignKey
ALTER TABLE "Domain" DROP CONSTRAINT "Domain_userId_fkey";

-- DropForeignKey
ALTER TABLE "Keyword" DROP CONSTRAINT "Keyword_domainVersionId_fkey";

-- DropForeignKey
ALTER TABLE "SuggestedCompetitor" DROP CONSTRAINT "SuggestedCompetitor_domainVersionId_fkey";

-- DropIndex
DROP INDEX "CompetitorAnalysis_domainVersionId_idx";

-- DropIndex
DROP INDEX "DashboardAnalysis_domainVersionId_idx";

-- DropIndex
DROP INDEX "Domain_userId_idx";

-- DropIndex
DROP INDEX "DomainVersion_domainId_isActive_idx";

-- DropIndex
DROP INDEX "DomainVersion_domainId_isActive_key";

-- DropIndex
DROP INDEX "Keyword_domainVersionId_idx";

-- DropIndex
DROP INDEX "Keyword_term_domainVersionId_key";

-- DropIndex
DROP INDEX "OnboardingProgress_domainVersionId_key";

-- DropIndex
DROP INDEX "SuggestedCompetitor_domainVersionId_idx";

-- AlterTable
ALTER TABLE "CompetitorAnalysis" ADD COLUMN     "domainId" INTEGER,
ALTER COLUMN "domainVersionId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "CrawlResult" ADD COLUMN     "domainId" INTEGER,
ALTER COLUMN "domainVersionId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "DashboardAnalysis" ADD COLUMN     "domainId" INTEGER,
ALTER COLUMN "domainVersionId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Domain" ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "DomainVersion" DROP COLUMN "isActive";

-- AlterTable
ALTER TABLE "Keyword" ADD COLUMN     "domainId" INTEGER,
ALTER COLUMN "domainVersionId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "OnboardingProgress" ADD COLUMN     "domainId" INTEGER,
ALTER COLUMN "domainVersionId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "SuggestedCompetitor" ADD COLUMN     "domainId" INTEGER,
ALTER COLUMN "domainVersionId" DROP NOT NULL;

-- DropTable
DROP TABLE "users";

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "CompetitorAnalysis_domainId_domainVersionId_idx" ON "CompetitorAnalysis"("domainId", "domainVersionId");

-- CreateIndex
CREATE INDEX "DashboardAnalysis_domainId_domainVersionId_idx" ON "DashboardAnalysis"("domainId", "domainVersionId");

-- CreateIndex
CREATE INDEX "DomainVersion_domainId_version_idx" ON "DomainVersion"("domainId", "version");

-- CreateIndex
CREATE INDEX "Keyword_domainId_domainVersionId_idx" ON "Keyword"("domainId", "domainVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "Keyword_term_domainId_domainVersionId_key" ON "Keyword"("term", "domainId", "domainVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "OnboardingProgress_domainId_domainVersionId_key" ON "OnboardingProgress"("domainId", "domainVersionId");

-- CreateIndex
CREATE INDEX "SuggestedCompetitor_domainId_domainVersionId_idx" ON "SuggestedCompetitor"("domainId", "domainVersionId");

-- AddForeignKey
ALTER TABLE "Domain" ADD CONSTRAINT "Domain_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrawlResult" ADD CONSTRAINT "CrawlResult_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrawlResult" ADD CONSTRAINT "CrawlResult_domainVersionId_fkey" FOREIGN KEY ("domainVersionId") REFERENCES "DomainVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Keyword" ADD CONSTRAINT "Keyword_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Keyword" ADD CONSTRAINT "Keyword_domainVersionId_fkey" FOREIGN KEY ("domainVersionId") REFERENCES "DomainVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DashboardAnalysis" ADD CONSTRAINT "DashboardAnalysis_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DashboardAnalysis" ADD CONSTRAINT "DashboardAnalysis_domainVersionId_fkey" FOREIGN KEY ("domainVersionId") REFERENCES "DomainVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetitorAnalysis" ADD CONSTRAINT "CompetitorAnalysis_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetitorAnalysis" ADD CONSTRAINT "CompetitorAnalysis_domainVersionId_fkey" FOREIGN KEY ("domainVersionId") REFERENCES "DomainVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuggestedCompetitor" ADD CONSTRAINT "SuggestedCompetitor_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuggestedCompetitor" ADD CONSTRAINT "SuggestedCompetitor_domainVersionId_fkey" FOREIGN KEY ("domainVersionId") REFERENCES "DomainVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnboardingProgress" ADD CONSTRAINT "OnboardingProgress_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE CASCADE ON UPDATE CASCADE;
