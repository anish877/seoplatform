/*
  Warnings:

  - You are about to drop the column `domainRank` on the `AIQueryResult` table. All the data in the column will be lost.
  - You are about to drop the column `foundDomains` on the `AIQueryResult` table. All the data in the column will be lost.
  - You are about to drop the column `modelVersion` on the `AIQueryResult` table. All the data in the column will be lost.
  - You are about to drop the column `processingTime` on the `AIQueryResult` table. All the data in the column will be lost.
  - You are about to drop the column `searchQuery` on the `AIQueryResult` table. All the data in the column will be lost.
  - You are about to drop the `AIGeneratedContent` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "AIGeneratedContent" DROP CONSTRAINT "AIGeneratedContent_onboardingProgressId_fkey";

-- AlterTable
ALTER TABLE "AIQueryResult" DROP COLUMN "domainRank",
DROP COLUMN "foundDomains",
DROP COLUMN "modelVersion",
DROP COLUMN "processingTime",
DROP COLUMN "searchQuery";

-- DropTable
DROP TABLE "AIGeneratedContent";
