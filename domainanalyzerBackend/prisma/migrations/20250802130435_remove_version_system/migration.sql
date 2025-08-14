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
ALTER TABLE "Phrase" DROP CONSTRAINT "Phrase_keywordId_fkey";

-- DropForeignKey
ALTER TABLE "SuggestedCompetitor" DROP CONSTRAINT "SuggestedCompetitor_domainId_fkey";

-- AlterTable
ALTER TABLE "CompetitorAnalysis" ALTER COLUMN "domainId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "CrawlResult" ALTER COLUMN "domainId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "DashboardAnalysis" ALTER COLUMN "domainId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Keyword" ALTER COLUMN "domainId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "SuggestedCompetitor" ALTER COLUMN "domainId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "OnboardingProgress" (
    "id" SERIAL NOT NULL,
    "domainId" INTEGER,
    "currentStep" INTEGER NOT NULL DEFAULT 0,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "stepData" JSONB,
    "lastActivity" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OnboardingProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OnboardingProgress_isCompleted_idx" ON "OnboardingProgress"("isCompleted");

-- CreateIndex
CREATE INDEX "OnboardingProgress_lastActivity_idx" ON "OnboardingProgress"("lastActivity");

-- CreateIndex
CREATE UNIQUE INDEX "OnboardingProgress_domainId_key" ON "OnboardingProgress"("domainId");

-- AddForeignKey
ALTER TABLE "CrawlResult" ADD CONSTRAINT "CrawlResult_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Keyword" ADD CONSTRAINT "Keyword_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Phrase" ADD CONSTRAINT "Phrase_keywordId_fkey" FOREIGN KEY ("keywordId") REFERENCES "Keyword"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIQueryResult" ADD CONSTRAINT "AIQueryResult_phraseId_fkey" FOREIGN KEY ("phraseId") REFERENCES "Phrase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DashboardAnalysis" ADD CONSTRAINT "DashboardAnalysis_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetitorAnalysis" ADD CONSTRAINT "CompetitorAnalysis_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuggestedCompetitor" ADD CONSTRAINT "SuggestedCompetitor_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnboardingProgress" ADD CONSTRAINT "OnboardingProgress_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE CASCADE ON UPDATE CASCADE;
