/*
  Warnings:

  - You are about to drop the column `domainVersionId` on the `CompetitorAnalysis` table. All the data in the column will be lost.
  - You are about to drop the column `domainVersionId` on the `CrawlResult` table. All the data in the column will be lost.
  - You are about to drop the column `domainVersionId` on the `DashboardAnalysis` table. All the data in the column will be lost.
  - You are about to drop the column `version` on the `Domain` table. All the data in the column will be lost.
  - You are about to drop the column `domainVersionId` on the `Keyword` table. All the data in the column will be lost.
  - You are about to drop the column `domainVersionId` on the `SuggestedCompetitor` table. All the data in the column will be lost.
  - You are about to drop the `DomainVersion` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `OnboardingProgress` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[term,domainId]` on the table `Keyword` will be added. If there are existing duplicate values, this will fail.
  - Made the column `domainId` on table `CompetitorAnalysis` required. This step will fail if there are existing NULL values in that column.
  - Made the column `domainId` on table `CrawlResult` required. This step will fail if there are existing NULL values in that column.
  - Made the column `domainId` on table `DashboardAnalysis` required. This step will fail if there are existing NULL values in that column.
  - Made the column `domainId` on table `Keyword` required. This step will fail if there are existing NULL values in that column.
  - Made the column `domainId` on table `SuggestedCompetitor` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "AIQueryResult" DROP CONSTRAINT "AIQueryResult_phraseId_fkey";

-- DropForeignKey
ALTER TABLE "CompetitorAnalysis" DROP CONSTRAINT "CompetitorAnalysis_domainId_fkey";

-- DropForeignKey
ALTER TABLE "CompetitorAnalysis" DROP CONSTRAINT "CompetitorAnalysis_domainVersionId_fkey";

-- DropForeignKey
ALTER TABLE "CrawlResult" DROP CONSTRAINT "CrawlResult_domainId_fkey";

-- DropForeignKey
ALTER TABLE "CrawlResult" DROP CONSTRAINT "CrawlResult_domainVersionId_fkey";

-- DropForeignKey
ALTER TABLE "DashboardAnalysis" DROP CONSTRAINT "DashboardAnalysis_domainId_fkey";

-- DropForeignKey
ALTER TABLE "DashboardAnalysis" DROP CONSTRAINT "DashboardAnalysis_domainVersionId_fkey";

-- DropForeignKey
ALTER TABLE "DomainVersion" DROP CONSTRAINT "DomainVersion_domainId_fkey";

-- DropForeignKey
ALTER TABLE "Keyword" DROP CONSTRAINT "Keyword_domainId_fkey";

-- DropForeignKey
ALTER TABLE "Keyword" DROP CONSTRAINT "Keyword_domainVersionId_fkey";

-- DropForeignKey
ALTER TABLE "OnboardingProgress" DROP CONSTRAINT "OnboardingProgress_domainId_fkey";

-- DropForeignKey
ALTER TABLE "OnboardingProgress" DROP CONSTRAINT "OnboardingProgress_domainVersionId_fkey";

-- DropForeignKey
ALTER TABLE "Phrase" DROP CONSTRAINT "Phrase_keywordId_fkey";

-- DropForeignKey
ALTER TABLE "SuggestedCompetitor" DROP CONSTRAINT "SuggestedCompetitor_domainId_fkey";

-- DropForeignKey
ALTER TABLE "SuggestedCompetitor" DROP CONSTRAINT "SuggestedCompetitor_domainVersionId_fkey";

-- DropIndex
DROP INDEX "CompetitorAnalysis_domainId_domainVersionId_idx";

-- DropIndex
DROP INDEX "DashboardAnalysis_domainId_domainVersionId_idx";

-- DropIndex
DROP INDEX "Keyword_domainId_domainVersionId_idx";

-- DropIndex
DROP INDEX "Keyword_term_domainId_domainVersionId_key";

-- DropIndex
DROP INDEX "SuggestedCompetitor_domainId_domainVersionId_idx";

-- AlterTable
ALTER TABLE "CompetitorAnalysis" DROP COLUMN "domainVersionId",
ALTER COLUMN "domainId" SET NOT NULL;

-- AlterTable
ALTER TABLE "CrawlResult" DROP COLUMN "domainVersionId",
ALTER COLUMN "domainId" SET NOT NULL;

-- AlterTable
ALTER TABLE "DashboardAnalysis" DROP COLUMN "domainVersionId",
ALTER COLUMN "domainId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Domain" DROP COLUMN "version";

-- AlterTable
ALTER TABLE "Keyword" DROP COLUMN "domainVersionId",
ALTER COLUMN "domainId" SET NOT NULL;

-- AlterTable
ALTER TABLE "SuggestedCompetitor" DROP COLUMN "domainVersionId",
ALTER COLUMN "domainId" SET NOT NULL;

-- DropTable
DROP TABLE "DomainVersion";

-- DropTable
DROP TABLE "OnboardingProgress";

-- CreateIndex
CREATE INDEX "CompetitorAnalysis_domainId_idx" ON "CompetitorAnalysis"("domainId");

-- CreateIndex
CREATE INDEX "DashboardAnalysis_domainId_idx" ON "DashboardAnalysis"("domainId");

-- CreateIndex
CREATE INDEX "Keyword_domainId_idx" ON "Keyword"("domainId");

-- CreateIndex
CREATE UNIQUE INDEX "Keyword_term_domainId_key" ON "Keyword"("term", "domainId");

-- CreateIndex
CREATE INDEX "SuggestedCompetitor_domainId_idx" ON "SuggestedCompetitor"("domainId");

-- AddForeignKey
ALTER TABLE "CrawlResult" ADD CONSTRAINT "CrawlResult_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Keyword" ADD CONSTRAINT "Keyword_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Phrase" ADD CONSTRAINT "Phrase_keywordId_fkey" FOREIGN KEY ("keywordId") REFERENCES "Keyword"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIQueryResult" ADD CONSTRAINT "AIQueryResult_phraseId_fkey" FOREIGN KEY ("phraseId") REFERENCES "Phrase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DashboardAnalysis" ADD CONSTRAINT "DashboardAnalysis_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetitorAnalysis" ADD CONSTRAINT "CompetitorAnalysis_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuggestedCompetitor" ADD CONSTRAINT "SuggestedCompetitor_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE CASCADE ON UPDATE CASCADE;
