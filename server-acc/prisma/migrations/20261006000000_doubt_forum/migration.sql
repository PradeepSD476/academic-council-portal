-- CreateEnum
CREATE TYPE "DoubtStatus" AS ENUM ('OPEN', 'RESOLVED');

-- CreateEnum
CREATE TYPE "DoubtReportStatus" AS ENUM ('PENDING', 'ACTIONED', 'DISMISSED');

-- CreateTable
CREATE TABLE "Doubt" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'Other',
    "status" "DoubtStatus" NOT NULL DEFAULT 'OPEN',
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    "authorId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Doubt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DoubtAnswer" (
    "id" SERIAL NOT NULL,
    "body" TEXT NOT NULL,
    "isAccepted" BOOLEAN NOT NULL DEFAULT false,
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    "doubtId" INTEGER NOT NULL,
    "authorId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DoubtAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DoubtVote" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "doubtId" INTEGER,
    "answerId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DoubtVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DoubtReport" (
    "id" SERIAL NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "DoubtReportStatus" NOT NULL DEFAULT 'PENDING',
    "reporterId" INTEGER NOT NULL,
    "doubtId" INTEGER,
    "answerId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DoubtReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Doubt_authorId_idx" ON "Doubt"("authorId");

-- CreateIndex
CREATE INDEX "Doubt_category_idx" ON "Doubt"("category");

-- CreateIndex
CREATE INDEX "Doubt_status_idx" ON "Doubt"("status");

-- CreateIndex
CREATE INDEX "Doubt_createdAt_idx" ON "Doubt"("createdAt");

-- CreateIndex
CREATE INDEX "DoubtAnswer_doubtId_idx" ON "DoubtAnswer"("doubtId");

-- CreateIndex
CREATE INDEX "DoubtAnswer_authorId_idx" ON "DoubtAnswer"("authorId");

-- CreateIndex
CREATE INDEX "DoubtVote_doubtId_idx" ON "DoubtVote"("doubtId");

-- CreateIndex
CREATE INDEX "DoubtVote_answerId_idx" ON "DoubtVote"("answerId");

-- CreateIndex
CREATE UNIQUE INDEX "DoubtVote_userId_doubtId_key" ON "DoubtVote"("userId", "doubtId");

-- CreateIndex
CREATE UNIQUE INDEX "DoubtVote_userId_answerId_key" ON "DoubtVote"("userId", "answerId");

-- CreateIndex
CREATE INDEX "DoubtReport_status_idx" ON "DoubtReport"("status");

-- CreateIndex
CREATE INDEX "DoubtReport_doubtId_idx" ON "DoubtReport"("doubtId");

-- CreateIndex
CREATE INDEX "DoubtReport_answerId_idx" ON "DoubtReport"("answerId");

-- AddForeignKey
ALTER TABLE "Doubt" ADD CONSTRAINT "Doubt_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoubtAnswer" ADD CONSTRAINT "DoubtAnswer_doubtId_fkey" FOREIGN KEY ("doubtId") REFERENCES "Doubt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoubtAnswer" ADD CONSTRAINT "DoubtAnswer_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoubtVote" ADD CONSTRAINT "DoubtVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoubtVote" ADD CONSTRAINT "DoubtVote_doubtId_fkey" FOREIGN KEY ("doubtId") REFERENCES "Doubt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoubtVote" ADD CONSTRAINT "DoubtVote_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "DoubtAnswer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoubtReport" ADD CONSTRAINT "DoubtReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoubtReport" ADD CONSTRAINT "DoubtReport_doubtId_fkey" FOREIGN KEY ("doubtId") REFERENCES "Doubt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoubtReport" ADD CONSTRAINT "DoubtReport_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "DoubtAnswer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
