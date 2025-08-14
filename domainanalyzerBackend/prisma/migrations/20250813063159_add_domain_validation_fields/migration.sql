-- AlterTable
ALTER TABLE "Domain" ADD COLUMN     "chatModel" TEXT,
ADD COLUMN     "customKeywords" TEXT,
ADD COLUMN     "intentPhrases" TEXT,
ADD COLUMN     "runAllModels" BOOLEAN NOT NULL DEFAULT false;
