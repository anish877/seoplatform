/*
  Warnings:

  - You are about to drop the column `domainId` on the `CompetitorAnalysis` table. All the data in the column will be lost.
  - You are about to drop the column `domainId` on the `CrawlResult` table. All the data in the column will be lost.
  - You are about to drop the column `domainId` on the `DashboardAnalysis` table. All the data in the column will be lost.
  - You are about to drop the column `version` on the `Domain` table. All the data in the column will be lost.
  - You are about to drop the column `domainId` on the `Keyword` table. All the data in the column will be lost.
  - You are about to drop the column `domainId` on the `OnboardingProgress` table. All the data in the column will be lost.
  - You are about to drop the column `domainId` on the `SuggestedCompetitor` table. All the data in the column will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[domainId,isActive]` on the table `DomainVersion` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[term,domainVersionId]` on the table `Keyword` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[domainVersionId]` on the table `OnboardingProgress` will be added. If there are existing duplicate values, this will fail.
  - Made the column `domainVersionId` on table `CompetitorAnalysis` required. This step will fail if there are existing NULL values in that column.
  - Made the column `domainVersionId` on table `CrawlResult` required. This step will fail if there are existing NULL values in that column.
  - Made the column `domainVersionId` on table `DashboardAnalysis` required. This step will fail if there are existing NULL values in that column.
  - Made the column `domainVersionId` on table `Keyword` required. This step will fail if there are existing NULL values in that column.
  - Made the column `domainVersionId` on table `OnboardingProgress` required. This step will fail if there are existing NULL values in that column.
  - Made the column `domainVersionId` on table `SuggestedCompetitor` required. This step will fail if there are existing NULL values in that column.

*/
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
ALTER TABLE "Domain" DROP CONSTRAINT "Domain_userId_fkey";

-- DropForeignKey
ALTER TABLE "Keyword" DROP CONSTRAINT "Keyword_domainId_fkey";

-- DropForeignKey
ALTER TABLE "Keyword" DROP CONSTRAINT "Keyword_domainVersionId_fkey";

-- DropForeignKey
ALTER TABLE "OnboardingProgress" DROP CONSTRAINT "OnboardingProgress_domainId_fkey";

-- DropForeignKey
ALTER TABLE "SuggestedCompetitor" DROP CONSTRAINT "SuggestedCompetitor_domainId_fkey";

-- DropForeignKey
ALTER TABLE "SuggestedCompetitor" DROP CONSTRAINT "SuggestedCompetitor_domainVersionId_fkey";

-- DropIndex
DROP INDEX "CompetitorAnalysis_domainId_domainVersionId_idx";

-- DropIndex
DROP INDEX "DashboardAnalysis_domainId_domainVersionId_idx";

-- DropIndex
DROP INDEX "DomainVersion_domainId_version_idx";

-- DropIndex
DROP INDEX "Keyword_domainId_domainVersionId_idx";

-- DropIndex
DROP INDEX "Keyword_term_domainId_domainVersionId_key";

-- DropIndex
DROP INDEX "OnboardingProgress_domainId_domainVersionId_key";

-- DropIndex
DROP INDEX "SuggestedCompetitor_domainId_domainVersionId_idx";

-- AlterTable
ALTER TABLE "CompetitorAnalysis" DROP COLUMN "domainId",
ALTER COLUMN "domainVersionId" SET NOT NULL;

-- AlterTable
ALTER TABLE "CrawlResult" DROP COLUMN "domainId",
ALTER COLUMN "domainVersionId" SET NOT NULL;

-- AlterTable
ALTER TABLE "DashboardAnalysis" DROP COLUMN "domainId",
ALTER COLUMN "domainVersionId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Domain" DROP COLUMN "version";

-- AlterTable
ALTER TABLE "DomainVersion" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Keyword" DROP COLUMN "domainId",
ALTER COLUMN "domainVersionId" SET NOT NULL;

-- AlterTable
ALTER TABLE "OnboardingProgress" DROP COLUMN "domainId",
ALTER COLUMN "domainVersionId" SET NOT NULL;

-- AlterTable
ALTER TABLE "SuggestedCompetitor" DROP COLUMN "domainId",
ALTER COLUMN "domainVersionId" SET NOT NULL;

-- DropTable
DROP TABLE "User";

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "CompetitorAnalysis_domainVersionId_idx" ON "CompetitorAnalysis"("domainVersionId");

-- CreateIndex
CREATE INDEX "DashboardAnalysis_domainVersionId_idx" ON "DashboardAnalysis"("domainVersionId");

-- CreateIndex
CREATE INDEX "Domain_userId_idx" ON "Domain"("userId");

-- CreateIndex
CREATE INDEX "DomainVersion_domainId_isActive_idx" ON "DomainVersion"("domainId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "DomainVersion_domainId_isActive_key" ON "DomainVersion"("domainId", "isActive");

-- CreateIndex
CREATE INDEX "Keyword_domainVersionId_idx" ON "Keyword"("domainVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "Keyword_term_domainVersionId_key" ON "Keyword"("term", "domainVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "OnboardingProgress_domainVersionId_key" ON "OnboardingProgress"("domainVersionId");

-- CreateIndex
CREATE INDEX "SuggestedCompetitor_domainVersionId_idx" ON "SuggestedCompetitor"("domainVersionId");

-- AddForeignKey
ALTER TABLE "Domain" ADD CONSTRAINT "Domain_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrawlResult" ADD CONSTRAINT "CrawlResult_domainVersionId_fkey" FOREIGN KEY ("domainVersionId") REFERENCES "DomainVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Keyword" ADD CONSTRAINT "Keyword_domainVersionId_fkey" FOREIGN KEY ("domainVersionId") REFERENCES "DomainVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DashboardAnalysis" ADD CONSTRAINT "DashboardAnalysis_domainVersionId_fkey" FOREIGN KEY ("domainVersionId") REFERENCES "DomainVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetitorAnalysis" ADD CONSTRAINT "CompetitorAnalysis_domainVersionId_fkey" FOREIGN KEY ("domainVersionId") REFERENCES "DomainVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuggestedCompetitor" ADD CONSTRAINT "SuggestedCompetitor_domainVersionId_fkey" FOREIGN KEY ("domainVersionId") REFERENCES "DomainVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
