-- DropForeignKey
ALTER TABLE "AIQueryResult" DROP CONSTRAINT "AIQueryResult_phraseId_fkey";

-- AddForeignKey
ALTER TABLE "AIQueryResult" ADD CONSTRAINT "AIQueryResult_phraseId_fkey" FOREIGN KEY ("phraseId") REFERENCES "GeneratedIntentPhrase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
