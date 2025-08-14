/*
  Warnings:

  - You are about to drop the column `confidenceScore` on the `CrawlResult` table. All the data in the column will be lost.
  - You are about to drop the column `contentBlocks` on the `CrawlResult` table. All the data in the column will be lost.
  - You are about to drop the column `keyEntities` on the `CrawlResult` table. All the data in the column will be lost.
  - Added the required column `analyzedUrls` to the `CrawlResult` table without a default value. This is not possible if the table is not empty.

*/
-- First, delete all existing data from CrawlResult table
DELETE FROM "CrawlResult";

-- AlterTable
ALTER TABLE "CrawlResult" DROP COLUMN "confidenceScore",
DROP COLUMN "contentBlocks",
DROP COLUMN "keyEntities",
ADD COLUMN     "analyzedUrls" TEXT NOT NULL;
