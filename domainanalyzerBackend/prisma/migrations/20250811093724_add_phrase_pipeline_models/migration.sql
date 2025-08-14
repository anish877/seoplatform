/*
  Warnings:

  - You are about to drop the column `enhancedPhraseId` on the `AIQueryResult` table. All the data in the column will be lost.
  - You are about to drop the `CommunityDataMining` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EnhancedPhrase` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `IntentClassificationEngine` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PhraseGenerationPhase` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RelevanceScoreCalculation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SearchPatternAnalysis` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "AIQueryResult" DROP CONSTRAINT "AIQueryResult_enhancedPhraseId_fkey";

-- DropForeignKey
ALTER TABLE "CommunityDataMining" DROP CONSTRAINT "CommunityDataMining_domainId_fkey";

-- DropForeignKey
ALTER TABLE "EnhancedPhrase" DROP CONSTRAINT "EnhancedPhrase_keywordId_fkey";

-- DropForeignKey
ALTER TABLE "IntentClassificationEngine" DROP CONSTRAINT "IntentClassificationEngine_domainId_fkey";

-- DropForeignKey
ALTER TABLE "PhraseGenerationPhase" DROP CONSTRAINT "PhraseGenerationPhase_domainId_fkey";

-- DropForeignKey
ALTER TABLE "RelevanceScoreCalculation" DROP CONSTRAINT "RelevanceScoreCalculation_domainId_fkey";

-- DropForeignKey
ALTER TABLE "SearchPatternAnalysis" DROP CONSTRAINT "SearchPatternAnalysis_domainId_fkey";

-- AlterTable
ALTER TABLE "AIQueryResult" DROP COLUMN "enhancedPhraseId";

-- AlterTable
ALTER TABLE "Phrase" ADD COLUMN     "relevanceScore" INTEGER,
ADD COLUMN     "sources" JSONB,
ADD COLUMN     "trend" TEXT;

-- DropTable
DROP TABLE "CommunityDataMining";

-- DropTable
DROP TABLE "EnhancedPhrase";

-- DropTable
DROP TABLE "IntentClassificationEngine";

-- DropTable
DROP TABLE "PhraseGenerationPhase";

-- DropTable
DROP TABLE "RelevanceScoreCalculation";

-- DropTable
DROP TABLE "SearchPatternAnalysis";

-- CreateTable
CREATE TABLE "CommunityInsight" (
    "id" SERIAL NOT NULL,
    "domainId" INTEGER,
    "keywordId" INTEGER,
    "sources" JSONB NOT NULL,
    "summary" TEXT NOT NULL,
    "tokenUsage" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunityInsight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SearchPattern" (
    "id" SERIAL NOT NULL,
    "domainId" INTEGER,
    "keywordId" INTEGER,
    "patterns" JSONB NOT NULL,
    "summary" TEXT NOT NULL,
    "tokenUsage" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SearchPattern_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhraseIntentClassification" (
    "id" SERIAL NOT NULL,
    "phraseId" INTEGER NOT NULL,
    "intent" TEXT NOT NULL,
    "confidence" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PhraseIntentClassification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhraseScore" (
    "id" SERIAL NOT NULL,
    "phraseId" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    "breakdown" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PhraseScore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CommunityInsight_domainId_idx" ON "CommunityInsight"("domainId");

-- CreateIndex
CREATE INDEX "CommunityInsight_keywordId_idx" ON "CommunityInsight"("keywordId");

-- CreateIndex
CREATE INDEX "SearchPattern_domainId_idx" ON "SearchPattern"("domainId");

-- CreateIndex
CREATE INDEX "SearchPattern_keywordId_idx" ON "SearchPattern"("keywordId");

-- CreateIndex
CREATE INDEX "PhraseIntentClassification_phraseId_idx" ON "PhraseIntentClassification"("phraseId");

-- CreateIndex
CREATE INDEX "PhraseScore_phraseId_idx" ON "PhraseScore"("phraseId");

-- AddForeignKey
ALTER TABLE "CommunityInsight" ADD CONSTRAINT "CommunityInsight_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityInsight" ADD CONSTRAINT "CommunityInsight_keywordId_fkey" FOREIGN KEY ("keywordId") REFERENCES "Keyword"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SearchPattern" ADD CONSTRAINT "SearchPattern_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SearchPattern" ADD CONSTRAINT "SearchPattern_keywordId_fkey" FOREIGN KEY ("keywordId") REFERENCES "Keyword"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhraseIntentClassification" ADD CONSTRAINT "PhraseIntentClassification_phraseId_fkey" FOREIGN KEY ("phraseId") REFERENCES "Phrase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhraseScore" ADD CONSTRAINT "PhraseScore_phraseId_fkey" FOREIGN KEY ("phraseId") REFERENCES "Phrase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
