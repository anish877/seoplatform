-- CreateTable
CREATE TABLE "DashboardAnalysis" (
    "id" SERIAL NOT NULL,
    "domainId" INTEGER NOT NULL,
    "metrics" JSONB NOT NULL,
    "insights" JSONB NOT NULL,
    "industryAnalysis" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DashboardAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompetitorAnalysis" (
    "id" SERIAL NOT NULL,
    "domainId" INTEGER NOT NULL,
    "competitors" JSONB NOT NULL,
    "marketInsights" JSONB NOT NULL,
    "strategicRecommendations" JSONB NOT NULL,
    "competitiveAnalysis" JSONB NOT NULL,
    "competitorList" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompetitorAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SuggestedCompetitor" (
    "id" SERIAL NOT NULL,
    "domainId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "competitorDomain" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SuggestedCompetitor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DashboardAnalysis_domainId_key" ON "DashboardAnalysis"("domainId");

-- CreateIndex
CREATE INDEX "DashboardAnalysis_domainId_idx" ON "DashboardAnalysis"("domainId");

-- CreateIndex
CREATE INDEX "CompetitorAnalysis_domainId_idx" ON "CompetitorAnalysis"("domainId");

-- CreateIndex
CREATE INDEX "SuggestedCompetitor_domainId_idx" ON "SuggestedCompetitor"("domainId");

-- AddForeignKey
ALTER TABLE "DashboardAnalysis" ADD CONSTRAINT "DashboardAnalysis_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetitorAnalysis" ADD CONSTRAINT "CompetitorAnalysis_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuggestedCompetitor" ADD CONSTRAINT "SuggestedCompetitor_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
