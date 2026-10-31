-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('INTERESTED', 'APPLIED', 'IN_PROGRESS', 'REJECTED', 'OFFER');

-- CreateTable
CREATE TABLE "SavedPosting" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "postingId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedPosting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostingApplication" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "postingId" INTEGER NOT NULL,
    "status" "ApplicationStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PostingApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SavedPosting_postingId_idx" ON "SavedPosting"("postingId");

-- CreateIndex
CREATE UNIQUE INDEX "SavedPosting_userId_postingId_key" ON "SavedPosting"("userId", "postingId");

-- CreateIndex
CREATE INDEX "PostingApplication_postingId_idx" ON "PostingApplication"("postingId");

-- CreateIndex
CREATE UNIQUE INDEX "PostingApplication_userId_postingId_key" ON "PostingApplication"("userId", "postingId");

-- AddForeignKey
ALTER TABLE "SavedPosting" ADD CONSTRAINT "SavedPosting_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedPosting" ADD CONSTRAINT "SavedPosting_postingId_fkey" FOREIGN KEY ("postingId") REFERENCES "Posting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostingApplication" ADD CONSTRAINT "PostingApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostingApplication" ADD CONSTRAINT "PostingApplication_postingId_fkey" FOREIGN KEY ("postingId") REFERENCES "Posting"("id") ON DELETE CASCADE ON UPDATE CASCADE;
