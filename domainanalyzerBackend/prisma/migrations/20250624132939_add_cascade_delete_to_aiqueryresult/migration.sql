-- DropForeignKey
ALTER TABLE "AIQueryResult" DROP CONSTRAINT "AIQueryResult_phraseId_fkey";

-- AddForeignKey
ALTER TABLE "AIQueryResult" ADD CONSTRAINT "AIQueryResult_phraseId_fkey" FOREIGN KEY ("phraseId") REFERENCES "Phrase"("id") ON DELETE CASCADE ON UPDATE CASCADE;
