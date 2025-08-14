-- AlterTable
ALTER TABLE "CrawlResult" ALTER COLUMN "confidenceScore" SET DATA TYPE DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "Keyword" (
    "id" SERIAL NOT NULL,
    "term" TEXT NOT NULL,
    "volume" INTEGER NOT NULL,
    "difficulty" TEXT NOT NULL,
    "cpc" DOUBLE PRECISION NOT NULL,
    "category" TEXT NOT NULL,
    "domainId" INTEGER NOT NULL,
    "isSelected" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Keyword_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Keyword_domainId_idx" ON "Keyword"("domainId");

-- CreateIndex
CREATE UNIQUE INDEX "Keyword_term_domainId_key" ON "Keyword"("term", "domainId");

-- AddForeignKey
ALTER TABLE "Keyword" ADD CONSTRAINT "Keyword_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
