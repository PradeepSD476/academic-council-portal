-- CreateTable
CREATE TABLE "PostingDeletion" (
    "id" SERIAL NOT NULL,
    "postingId" INTEGER NOT NULL,
    "roleTitle" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "removed" JSONB NOT NULL,
    "byUserId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostingDeletion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PostingDeletion_createdAt_idx" ON "PostingDeletion"("createdAt");

-- CreateIndex
CREATE INDEX "PostingDeletion_byUserId_idx" ON "PostingDeletion"("byUserId");
