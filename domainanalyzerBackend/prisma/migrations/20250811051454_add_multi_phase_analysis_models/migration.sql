-- CreateTable
CREATE TABLE "AnalysisPhase" (
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

    CONSTRAINT "AnalysisPhase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SemanticAnalysis" (
    "id" SERIAL NOT NULL,
    "domainId" INTEGER,
    "contentSummary" TEXT NOT NULL,
    "keyThemes" JSONB NOT NULL,
    "brandVoice" TEXT NOT NULL,
    "targetAudience" JSONB NOT NULL,
    "contentGaps" JSONB NOT NULL,
    "tokenUsage" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SemanticAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KeywordAnalysis" (
    "id" SERIAL NOT NULL,
    "domainId" INTEGER,
    "keywords" JSONB NOT NULL,
    "searchVolumeData" JSONB NOT NULL,
    "intentClassification" JSONB NOT NULL,
    "competitiveAnalysis" JSONB NOT NULL,
    "tokenUsage" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KeywordAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SearchVolumeClassification" (
    "id" SERIAL NOT NULL,
    "domainId" INTEGER,
    "highVolumeKeywords" JSONB NOT NULL,
    "mediumVolumeKeywords" JSONB NOT NULL,
    "lowVolumeKeywords" JSONB NOT NULL,
    "volumeTrends" JSONB NOT NULL,
    "seasonalPatterns" JSONB NOT NULL,
    "tokenUsage" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SearchVolumeClassification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntentClassification" (
    "id" SERIAL NOT NULL,
    "domainId" INTEGER,
    "informationalKeywords" JSONB NOT NULL,
    "navigationalKeywords" JSONB NOT NULL,
    "transactionalKeywords" JSONB NOT NULL,
    "commercialKeywords" JSONB NOT NULL,
    "intentDistribution" JSONB NOT NULL,
    "tokenUsage" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntentClassification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AnalysisPhase_domainId_idx" ON "AnalysisPhase"("domainId");

-- CreateIndex
CREATE UNIQUE INDEX "AnalysisPhase_domainId_phase_key" ON "AnalysisPhase"("domainId", "phase");

-- CreateIndex
CREATE INDEX "SemanticAnalysis_domainId_idx" ON "SemanticAnalysis"("domainId");

-- CreateIndex
CREATE INDEX "KeywordAnalysis_domainId_idx" ON "KeywordAnalysis"("domainId");

-- CreateIndex
CREATE INDEX "SearchVolumeClassification_domainId_idx" ON "SearchVolumeClassification"("domainId");

-- CreateIndex
CREATE INDEX "IntentClassification_domainId_idx" ON "IntentClassification"("domainId");

-- AddForeignKey
ALTER TABLE "AnalysisPhase" ADD CONSTRAINT "AnalysisPhase_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SemanticAnalysis" ADD CONSTRAINT "SemanticAnalysis_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KeywordAnalysis" ADD CONSTRAINT "KeywordAnalysis_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SearchVolumeClassification" ADD CONSTRAINT "SearchVolumeClassification_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntentClassification" ADD CONSTRAINT "IntentClassification_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE SET NULL ON UPDATE CASCADE;
