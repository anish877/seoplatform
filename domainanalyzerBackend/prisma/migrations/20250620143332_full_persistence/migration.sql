-- CreateTable
CREATE TABLE "Phrase" (
    "id" SERIAL NOT NULL,
    "text" TEXT NOT NULL,
    "keywordId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Phrase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIQueryResult" (
    "id" SERIAL NOT NULL,
    "phraseId" INTEGER NOT NULL,
    "model" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "latency" DOUBLE PRECISION NOT NULL,
    "cost" DOUBLE PRECISION NOT NULL,
    "presence" INTEGER NOT NULL,
    "relevance" INTEGER NOT NULL,
    "accuracy" INTEGER NOT NULL,
    "sentiment" INTEGER NOT NULL,
    "overall" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIQueryResult_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Phrase" ADD CONSTRAINT "Phrase_keywordId_fkey" FOREIGN KEY ("keywordId") REFERENCES "Keyword"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIQueryResult" ADD CONSTRAINT "AIQueryResult_phraseId_fkey" FOREIGN KEY ("phraseId") REFERENCES "Phrase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
