-- CreateTable
CREATE TABLE "CommunityDataMining" (
    "id" SERIAL NOT NULL,
    "domainId" INTEGER,
    "redditInsights" JSONB NOT NULL,
    "quoraInsights" JSONB NOT NULL,
    "communityTrends" JSONB NOT NULL,
    "userPainPoints" JSONB NOT NULL,
    "popularTopics" JSONB NOT NULL,
    "tokenUsage" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunityDataMining_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SearchPatternAnalysis" (
    "id" SERIAL NOT NULL,
    "domainId" INTEGER,
    "searchBehaviors" JSONB NOT NULL,
    "queryPatterns" JSONB NOT NULL,
    "seasonalTrends" JSONB NOT NULL,
    "userJourneyMaps" JSONB NOT NULL,
    "searchIntentFlow" JSONB NOT NULL,
    "tokenUsage" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SearchPatternAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntentClassificationEngine" (
    "id" SERIAL NOT NULL,
    "domainId" INTEGER,
    "intentCategories" JSONB NOT NULL,
    "intentPatterns" JSONB NOT NULL,
    "userMotivations" JSONB NOT NULL,
    "decisionStages" JSONB NOT NULL,
    "intentConfidence" JSONB NOT NULL,
    "tokenUsage" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntentClassificationEngine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RelevanceScoreCalculation" (
    "id" SERIAL NOT NULL,
    "domainId" INTEGER,
    "semanticScores" JSONB NOT NULL,
    "contextualScores" JSONB NOT NULL,
    "userIntentScores" JSONB NOT NULL,
    "competitiveScores" JSONB NOT NULL,
    "overallRelevance" JSONB NOT NULL,
    "tokenUsage" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RelevanceScoreCalculation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnhancedPhraseGeneration" (
    "id" SERIAL NOT NULL,
    "domainId" INTEGER,
    "keyword" TEXT NOT NULL,
    "generatedPhrases" JSONB NOT NULL,
    "intentAlignment" JSONB NOT NULL,
    "relevanceScores" JSONB NOT NULL,
    "communityInsights" JSONB NOT NULL,
    "searchPatterns" JSONB NOT NULL,
    "tokenUsage" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EnhancedPhraseGeneration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CommunityDataMining_domainId_idx" ON "CommunityDataMining"("domainId");

-- CreateIndex
CREATE INDEX "SearchPatternAnalysis_domainId_idx" ON "SearchPatternAnalysis"("domainId");

-- CreateIndex
CREATE INDEX "IntentClassificationEngine_domainId_idx" ON "IntentClassificationEngine"("domainId");

-- CreateIndex
CREATE INDEX "RelevanceScoreCalculation_domainId_idx" ON "RelevanceScoreCalculation"("domainId");

-- CreateIndex
CREATE INDEX "EnhancedPhraseGeneration_domainId_idx" ON "EnhancedPhraseGeneration"("domainId");

-- CreateIndex
CREATE INDEX "EnhancedPhraseGeneration_keyword_idx" ON "EnhancedPhraseGeneration"("keyword");

-- AddForeignKey
ALTER TABLE "CommunityDataMining" ADD CONSTRAINT "CommunityDataMining_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SearchPatternAnalysis" ADD CONSTRAINT "SearchPatternAnalysis_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntentClassificationEngine" ADD CONSTRAINT "IntentClassificationEngine_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelevanceScoreCalculation" ADD CONSTRAINT "RelevanceScoreCalculation_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnhancedPhraseGeneration" ADD CONSTRAINT "EnhancedPhraseGeneration_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE SET NULL ON UPDATE CASCADE;
