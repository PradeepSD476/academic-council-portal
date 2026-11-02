-- CreateTable
CREATE TABLE "PostingDailyStat" (
    "id" SERIAL NOT NULL,
    "postingId" INTEGER NOT NULL,
    "day" TIMESTAMP(3) NOT NULL,
    "applyClicks" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PostingDailyStat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareersWeeklyVisitor" (
    "weekStart" TIMESTAMP(3) NOT NULL,
    "visitorKey" TEXT NOT NULL,

    CONSTRAINT "CareersWeeklyVisitor_pkey" PRIMARY KEY ("weekStart","visitorKey")
);

-- CreateIndex
CREATE INDEX "PostingDailyStat_day_idx" ON "PostingDailyStat"("day");

-- CreateIndex
CREATE UNIQUE INDEX "PostingDailyStat_postingId_day_key" ON "PostingDailyStat"("postingId", "day");

-- AddForeignKey
ALTER TABLE "PostingDailyStat" ADD CONSTRAINT "PostingDailyStat_postingId_fkey" FOREIGN KEY ("postingId") REFERENCES "Posting"("id") ON DELETE CASCADE ON UPDATE CASCADE;
