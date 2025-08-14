/*
  Warnings:

  - Made the column `domainId` on table `CommunityMiningResult` required. This step will fail if there are existing NULL values in that column.
  - Made the column `domainId` on table `GeneratedIntentPhrase` required. This step will fail if there are existing NULL values in that column.
  - Made the column `domainId` on table `IntentClassificationResult` required. This step will fail if there are existing NULL values in that column.
  - Made the column `domainId` on table `RelevanceScoreResult` required. This step will fail if there are existing NULL values in that column.
  - Made the column `domainId` on table `SearchPatternResult` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "CommunityMiningResult" DROP CONSTRAINT "CommunityMiningResult_domainId_fkey";

-- DropForeignKey
ALTER TABLE "GeneratedIntentPhrase" DROP CONSTRAINT "GeneratedIntentPhrase_domainId_fkey";

-- DropForeignKey
ALTER TABLE "IntentClassificationResult" DROP CONSTRAINT "IntentClassificationResult_domainId_fkey";

-- DropForeignKey
ALTER TABLE "RelevanceScoreResult" DROP CONSTRAINT "RelevanceScoreResult_domainId_fkey";

-- DropForeignKey
ALTER TABLE "SearchPatternResult" DROP CONSTRAINT "SearchPatternResult_domainId_fkey";

-- DropIndex
DROP INDEX "AnalysisPhase_domainId_phase_key";

-- DropIndex
DROP INDEX "IntentPhraseGeneration_domainId_phase_key";

-- AlterTable
ALTER TABLE "CommunityMiningResult" ALTER COLUMN "domainId" SET NOT NULL;

-- AlterTable
ALTER TABLE "GeneratedIntentPhrase" ALTER COLUMN "domainId" SET NOT NULL;

-- AlterTable
ALTER TABLE "IntentClassificationResult" ALTER COLUMN "domainId" SET NOT NULL;

-- AlterTable
ALTER TABLE "RelevanceScoreResult" ALTER COLUMN "domainId" SET NOT NULL;

-- AlterTable
ALTER TABLE "SearchPatternResult" ALTER COLUMN "domainId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "AnalysisPhase_domainId_phase_idx" ON "AnalysisPhase"("domainId", "phase");

-- CreateIndex
CREATE INDEX "IntentPhraseGeneration_domainId_phase_idx" ON "IntentPhraseGeneration"("domainId", "phase");

-- AddForeignKey
ALTER TABLE "CommunityMiningResult" ADD CONSTRAINT "CommunityMiningResult_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SearchPatternResult" ADD CONSTRAINT "SearchPatternResult_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntentClassificationResult" ADD CONSTRAINT "IntentClassificationResult_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedIntentPhrase" ADD CONSTRAINT "GeneratedIntentPhrase_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelevanceScoreResult" ADD CONSTRAINT "RelevanceScoreResult_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
