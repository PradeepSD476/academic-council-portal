-- CreateTable
CREATE TABLE "PostingReport" (
    "id" SERIAL NOT NULL,
    "postingId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "handledAt" TIMESTAMP(3),

    CONSTRAINT "PostingReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PostingReport_postingId_handledAt_idx" ON "PostingReport"("postingId", "handledAt");

-- CreateIndex
CREATE UNIQUE INDEX "PostingReport_userId_postingId_key" ON "PostingReport"("userId", "postingId");

-- AddForeignKey
ALTER TABLE "PostingReport" ADD CONSTRAINT "PostingReport_postingId_fkey" FOREIGN KEY ("postingId") REFERENCES "Posting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostingReport" ADD CONSTRAINT "PostingReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
