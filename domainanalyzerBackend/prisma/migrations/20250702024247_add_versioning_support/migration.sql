/*
  Warnings:

  - A unique constraint covering the columns `[term,domainId,domainVersionId]` on the table `Keyword` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "AIQueryResult" DROP CONSTRAINT "AIQueryResult_phraseId_fkey";

-- DropForeignKey
ALTER TABLE "CompetitorAnalysis" DROP CONSTRAINT "CompetitorAnalysis_domainId_fkey";

-- DropForeignKey
ALTER TABLE "CrawlResult" DROP CONSTRAINT "CrawlResult_domainId_fkey";

-- DropForeignKey
ALTER TABLE "DashboardAnalysis" DROP CONSTRAINT "DashboardAnalysis_domainId_fkey";

-- DropForeignKey
ALTER TABLE "Keyword" DROP CONSTRAINT "Keyword_domainId_fkey";

-- DropForeignKey
ALTER TABLE "SuggestedCompetitor" DROP CONSTRAINT "SuggestedCompetitor_domainId_fkey";

-- DropIndex
DROP INDEX "CompetitorAnalysis_domainId_idx";

-- DropIndex
DROP INDEX "DashboardAnalysis_domainId_idx";

-- DropIndex
DROP INDEX "DashboardAnalysis_domainId_key";

-- DropIndex
DROP INDEX "Keyword_domainId_idx";

-- DropIndex
DROP INDEX "Keyword_term_domainId_key";

-- DropIndex
DROP INDEX "OnboardingProgress_domainId_key";

-- DropIndex
DROP INDEX "SuggestedCompetitor_domainId_idx";

-- AlterTable
ALTER TABLE "CompetitorAnalysis" ADD COLUMN     "domainVersionId" INTEGER,
ALTER COLUMN "domainId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "CrawlResult" ADD COLUMN     "domainVersionId" INTEGER,
ALTER COLUMN "domainId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "DashboardAnalysis" ADD COLUMN     "domainVersionId" INTEGER,
ALTER COLUMN "domainId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Domain" ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "Keyword" ADD COLUMN     "domainVersionId" INTEGER,
ALTER COLUMN "domainId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "OnboardingProgress" ADD COLUMN     "domainVersionId" INTEGER,
ALTER COLUMN "domainId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "SuggestedCompetitor" ADD COLUMN     "domainVersionId" INTEGER,
ALTER COLUMN "domainId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "DomainVersion" (
    "id" SERIAL NOT NULL,
    "domainId" INTEGER NOT NULL,
    "version" INTEGER NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DomainVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DomainVersion_domainId_version_idx" ON "DomainVersion"("domainId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "DomainVersion_domainId_version_key" ON "DomainVersion"("domainId", "version");

-- CreateIndex
CREATE INDEX "CompetitorAnalysis_domainId_domainVersionId_idx" ON "CompetitorAnalysis"("domainId", "domainVersionId");

-- CreateIndex
CREATE INDEX "DashboardAnalysis_domainId_domainVersionId_idx" ON "DashboardAnalysis"("domainId", "domainVersionId");

-- CreateIndex
CREATE INDEX "Keyword_domainId_domainVersionId_idx" ON "Keyword"("domainId", "domainVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "Keyword_term_domainId_domainVersionId_key" ON "Keyword"("term", "domainId", "domainVersionId");

-- CreateIndex
CREATE INDEX "SuggestedCompetitor_domainId_domainVersionId_idx" ON "SuggestedCompetitor"("domainId", "domainVersionId");

-- AddForeignKey
ALTER TABLE "DomainVersion" ADD CONSTRAINT "DomainVersion_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrawlResult" ADD CONSTRAINT "CrawlResult_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrawlResult" ADD CONSTRAINT "CrawlResult_domainVersionId_fkey" FOREIGN KEY ("domainVersionId") REFERENCES "DomainVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Keyword" ADD CONSTRAINT "Keyword_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Keyword" ADD CONSTRAINT "Keyword_domainVersionId_fkey" FOREIGN KEY ("domainVersionId") REFERENCES "DomainVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIQueryResult" ADD CONSTRAINT "AIQueryResult_phraseId_fkey" FOREIGN KEY ("phraseId") REFERENCES "Phrase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

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
ALTER TABLE "OnboardingProgress" ADD CONSTRAINT "OnboardingProgress_domainVersionId_fkey" FOREIGN KEY ("domainVersionId") REFERENCES "DomainVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
