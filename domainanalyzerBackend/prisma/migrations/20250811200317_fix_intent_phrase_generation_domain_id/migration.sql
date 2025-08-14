/*
  Warnings:

  - Made the column `domainId` on table `IntentPhraseGeneration` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "IntentPhraseGeneration" DROP CONSTRAINT "IntentPhraseGeneration_domainId_fkey";

-- AlterTable
ALTER TABLE "IntentPhraseGeneration" ALTER COLUMN "domainId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "IntentPhraseGeneration" ADD CONSTRAINT "IntentPhraseGeneration_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
