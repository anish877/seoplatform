/*
  Warnings:

  - A unique constraint covering the columns `[domainId,phase]` on the table `AnalysisPhase` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "AnalysisPhase_domainId_phase_idx";

-- CreateIndex
CREATE UNIQUE INDEX "AnalysisPhase_domainId_phase_key" ON "AnalysisPhase"("domainId", "phase");
