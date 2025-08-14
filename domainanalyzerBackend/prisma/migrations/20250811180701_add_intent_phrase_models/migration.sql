-- CreateTable
CREATE TABLE "IntentPhraseGeneration" (
    "id" SERIAL NOT NULL,
    "domainId" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "phase" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" TIMESTAMP(3),
    "result" JSONB,
    "error" TEXT,
    "tokenUsage" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntentPhraseGeneration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityMiningResult" (
    "id" SERIAL NOT NULL,
    "domainId" INTEGER,
    "keywordId" INTEGER,
    "platform" TEXT NOT NULL,
    "insights" JSONB NOT NULL,
    "sentiment" TEXT,
    "frequency" INTEGER,
    "tokenUsage" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunityMiningResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SearchPatternResult" (
    "id" SERIAL NOT NULL,
    "domainId" INTEGER,
    "keywordId" INTEGER,
    "patterns" JSONB NOT NULL,
    "volume" INTEGER,
    "seasonality" JSONB,
    "trends" JSONB,
    "tokenUsage" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SearchPatternResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntentClassificationResult" (
    "id" SERIAL NOT NULL,
    "domainId" INTEGER,
    "keywordId" INTEGER,
    "intent" TEXT NOT NULL,
    "confidence" INTEGER,
    "patterns" JSONB,
    "tokenUsage" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IntentClassificationResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeneratedIntentPhrase" (
    "id" SERIAL NOT NULL,
    "domainId" INTEGER,
    "keywordId" INTEGER,
    "phrase" TEXT NOT NULL,
    "relevanceScore" INTEGER,
    "sources" JSONB,
    "trend" TEXT,
    "intent" TEXT,
    "communityInsights" JSONB,
    "searchPatterns" JSONB,
    "isSelected" BOOLEAN NOT NULL DEFAULT false,
    "tokenUsage" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GeneratedIntentPhrase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RelevanceScoreResult" (
    "id" SERIAL NOT NULL,
    "domainId" INTEGER,
    "phraseId" INTEGER,
    "score" INTEGER NOT NULL,
    "breakdown" JSONB,
    "factors" JSONB,
    "tokenUsage" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RelevanceScoreResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IntentPhraseGeneration_domainId_idx" ON "IntentPhraseGeneration"("domainId");

-- CreateIndex
CREATE UNIQUE INDEX "IntentPhraseGeneration_domainId_phase_key" ON "IntentPhraseGeneration"("domainId", "phase");

-- CreateIndex
CREATE INDEX "CommunityMiningResult_domainId_idx" ON "CommunityMiningResult"("domainId");

-- CreateIndex
CREATE INDEX "CommunityMiningResult_keywordId_idx" ON "CommunityMiningResult"("keywordId");

-- CreateIndex
CREATE INDEX "SearchPatternResult_domainId_idx" ON "SearchPatternResult"("domainId");

-- CreateIndex
CREATE INDEX "SearchPatternResult_keywordId_idx" ON "SearchPatternResult"("keywordId");

-- CreateIndex
CREATE INDEX "IntentClassificationResult_domainId_idx" ON "IntentClassificationResult"("domainId");

-- CreateIndex
CREATE INDEX "IntentClassificationResult_keywordId_idx" ON "IntentClassificationResult"("keywordId");

-- CreateIndex
CREATE INDEX "GeneratedIntentPhrase_domainId_idx" ON "GeneratedIntentPhrase"("domainId");

-- CreateIndex
CREATE INDEX "GeneratedIntentPhrase_keywordId_idx" ON "GeneratedIntentPhrase"("keywordId");

-- CreateIndex
CREATE INDEX "RelevanceScoreResult_domainId_idx" ON "RelevanceScoreResult"("domainId");

-- CreateIndex
CREATE INDEX "RelevanceScoreResult_phraseId_idx" ON "RelevanceScoreResult"("phraseId");

-- AddForeignKey
ALTER TABLE "IntentPhraseGeneration" ADD CONSTRAINT "IntentPhraseGeneration_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityMiningResult" ADD CONSTRAINT "CommunityMiningResult_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityMiningResult" ADD CONSTRAINT "CommunityMiningResult_keywordId_fkey" FOREIGN KEY ("keywordId") REFERENCES "Keyword"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SearchPatternResult" ADD CONSTRAINT "SearchPatternResult_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SearchPatternResult" ADD CONSTRAINT "SearchPatternResult_keywordId_fkey" FOREIGN KEY ("keywordId") REFERENCES "Keyword"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntentClassificationResult" ADD CONSTRAINT "IntentClassificationResult_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntentClassificationResult" ADD CONSTRAINT "IntentClassificationResult_keywordId_fkey" FOREIGN KEY ("keywordId") REFERENCES "Keyword"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedIntentPhrase" ADD CONSTRAINT "GeneratedIntentPhrase_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedIntentPhrase" ADD CONSTRAINT "GeneratedIntentPhrase_keywordId_fkey" FOREIGN KEY ("keywordId") REFERENCES "Keyword"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelevanceScoreResult" ADD CONSTRAINT "RelevanceScoreResult_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelevanceScoreResult" ADD CONSTRAINT "RelevanceScoreResult_phraseId_fkey" FOREIGN KEY ("phraseId") REFERENCES "GeneratedIntentPhrase"("id") ON DELETE SET NULL ON UPDATE CASCADE;
