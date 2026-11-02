-- CreateTable
CREATE TABLE "HiddenPosting" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "postingId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HiddenPosting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HiddenPosting_postingId_idx" ON "HiddenPosting"("postingId");

-- CreateIndex
CREATE UNIQUE INDEX "HiddenPosting_userId_postingId_key" ON "HiddenPosting"("userId", "postingId");

-- AddForeignKey
ALTER TABLE "HiddenPosting" ADD CONSTRAINT "HiddenPosting_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HiddenPosting" ADD CONSTRAINT "HiddenPosting_postingId_fkey" FOREIGN KEY ("postingId") REFERENCES "Posting"("id") ON DELETE CASCADE ON UPDATE CASCADE;
