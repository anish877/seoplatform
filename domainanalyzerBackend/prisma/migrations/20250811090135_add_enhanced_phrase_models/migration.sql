/*
  Warnings:

  - You are about to drop the column `popularTopics` on the `CommunityDataMining` table. All the data in the column will be lost.
  - You are about to drop the column `decisionStages` on the `IntentClassificationEngine` table. All the data in the column will be lost.
  - You are about to drop the column `intentCategories` on the `IntentClassificationEngine` table. All the data in the column will be lost.
  - You are about to drop the column `intentConfidence` on the `IntentClassificationEngine` table. All the data in the column will be lost.
  - You are about to drop the column `intentPatterns` on the `IntentClassificationEngine` table. All the data in the column will be lost.
  - You are about to drop the column `userMotivations` on the `IntentClassificationEngine` table. All the data in the column will be lost.
  - You are about to drop the column `competitiveScores` on the `RelevanceScoreCalculation` table. All the data in the column will be lost.
  - You are about to drop the column `contextualScores` on the `RelevanceScoreCalculation` table. All the data in the column will be lost.
  - You are about to drop the column `overallRelevance` on the `RelevanceScoreCalculation` table. All the data in the column will be lost.
  - You are about to drop the column `semanticScores` on the `RelevanceScoreCalculation` table. All the data in the column will be lost.
  - You are about to drop the column `userIntentScores` on the `RelevanceScoreCalculation` table. All the data in the column will be lost.
  - You are about to drop the column `searchIntentFlow` on the `SearchPatternAnalysis` table. All the data in the column will be lost.
  - You are about to drop the column `userJourneyMaps` on the `SearchPatternAnalysis` table. All the data in the column will be lost.
  - You are about to drop the `EnhancedPhraseGeneration` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `discussionTopics` to the `CommunityDataMining` table without a default value. This is not possible if the table is not empty.
  - Added the required column `commercialIntent` to the `IntentClassificationEngine` table without a default value. This is not possible if the table is not empty.
  - Added the required column `informationalIntent` to the `IntentClassificationEngine` table without a default value. This is not possible if the table is not empty.
  - Added the required column `intentMapping` to the `IntentClassificationEngine` table without a default value. This is not possible if the table is not empty.
  - Added the required column `navigationalIntent` to the `IntentClassificationEngine` table without a default value. This is not possible if the table is not empty.
  - Added the required column `transactionalIntent` to the `IntentClassificationEngine` table without a default value. This is not possible if the table is not empty.
  - Added the required column `communityFrequency` to the `RelevanceScoreCalculation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `finalScores` to the `RelevanceScoreCalculation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `intentMatch` to the `RelevanceScoreCalculation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `llmTrainingFrequency` to the `RelevanceScoreCalculation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `recency` to the `RelevanceScoreCalculation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `semanticSimilarity` to the `RelevanceScoreCalculation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `geographicPatterns` to the `SearchPatternAnalysis` table without a default value. This is not possible if the table is not empty.
  - Added the required column `searchIntent` to the `SearchPatternAnalysis` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "EnhancedPhraseGeneration" DROP CONSTRAINT "EnhancedPhraseGeneration_domainId_fkey";

-- AlterTable
ALTER TABLE "AIQueryResult" ADD COLUMN     "enhancedPhraseId" INTEGER;

-- AlterTable
ALTER TABLE "CommunityDataMining" DROP COLUMN "popularTopics",
ADD COLUMN     "discussionTopics" JSONB NOT NULL;

-- AlterTable
ALTER TABLE "IntentClassificationEngine" DROP COLUMN "decisionStages",
DROP COLUMN "intentCategories",
DROP COLUMN "intentConfidence",
DROP COLUMN "intentPatterns",
DROP COLUMN "userMotivations",
ADD COLUMN     "commercialIntent" JSONB NOT NULL,
ADD COLUMN     "informationalIntent" JSONB NOT NULL,
ADD COLUMN     "intentMapping" JSONB NOT NULL,
ADD COLUMN     "navigationalIntent" JSONB NOT NULL,
ADD COLUMN     "transactionalIntent" JSONB NOT NULL;

-- AlterTable
ALTER TABLE "RelevanceScoreCalculation" DROP COLUMN "competitiveScores",
DROP COLUMN "contextualScores",
DROP COLUMN "overallRelevance",
DROP COLUMN "semanticScores",
DROP COLUMN "userIntentScores",
ADD COLUMN     "communityFrequency" JSONB NOT NULL,
ADD COLUMN     "finalScores" JSONB NOT NULL,
ADD COLUMN     "intentMatch" JSONB NOT NULL,
ADD COLUMN     "llmTrainingFrequency" JSONB NOT NULL,
ADD COLUMN     "recency" JSONB NOT NULL,
ADD COLUMN     "semanticSimilarity" JSONB NOT NULL;

-- AlterTable
ALTER TABLE "SearchPatternAnalysis" DROP COLUMN "searchIntentFlow",
DROP COLUMN "userJourneyMaps",
ADD COLUMN     "geographicPatterns" JSONB NOT NULL,
ADD COLUMN     "searchIntent" JSONB NOT NULL;

-- DropTable
DROP TABLE "EnhancedPhraseGeneration";

-- CreateTable
CREATE TABLE "PhraseGenerationPhase" (
    "id" SERIAL NOT NULL,
    "domainId" INTEGER,
    "phase" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "startTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),
    "result" JSONB,
    "error" TEXT,
    "tokenUsage" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PhraseGenerationPhase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnhancedPhrase" (
    "id" SERIAL NOT NULL,
    "text" TEXT NOT NULL,
    "keywordId" INTEGER NOT NULL,
    "relevanceScore" INTEGER NOT NULL,
    "sources" JSONB NOT NULL,
    "trend" TEXT NOT NULL,
    "intentType" TEXT NOT NULL,
    "communityData" JSONB NOT NULL,
    "searchPattern" JSONB NOT NULL,
    "intentClassification" JSONB NOT NULL,
    "relevanceCalculation" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EnhancedPhrase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PhraseGenerationPhase_domainId_idx" ON "PhraseGenerationPhase"("domainId");

-- CreateIndex
CREATE UNIQUE INDEX "PhraseGenerationPhase_domainId_phase_key" ON "PhraseGenerationPhase"("domainId", "phase");

-- CreateIndex
CREATE INDEX "EnhancedPhrase_keywordId_idx" ON "EnhancedPhrase"("keywordId");

-- AddForeignKey
ALTER TABLE "AIQueryResult" ADD CONSTRAINT "AIQueryResult_enhancedPhraseId_fkey" FOREIGN KEY ("enhancedPhraseId") REFERENCES "EnhancedPhrase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhraseGenerationPhase" ADD CONSTRAINT "PhraseGenerationPhase_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnhancedPhrase" ADD CONSTRAINT "EnhancedPhrase_keywordId_fkey" FOREIGN KEY ("keywordId") REFERENCES "Keyword"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
