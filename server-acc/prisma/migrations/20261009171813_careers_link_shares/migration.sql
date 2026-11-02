-- CreateTable
CREATE TABLE "LinkShare" (
    "id" SERIAL NOT NULL,
    "submissionId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LinkShare_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LinkShare_userId_createdAt_idx" ON "LinkShare"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "LinkShare_submissionId_userId_key" ON "LinkShare"("submissionId", "userId");

-- AddForeignKey
ALTER TABLE "LinkShare" ADD CONSTRAINT "LinkShare_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "LinkSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
