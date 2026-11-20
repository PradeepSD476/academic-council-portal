CREATE TABLE "ExamWorkbookCache" (
    "datasetId" TEXT NOT NULL,
    "sourceKey" TEXT NOT NULL,
    "workbook" BYTEA NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ExamWorkbookCache_pkey" PRIMARY KEY ("datasetId", "sourceKey")
);
CREATE TABLE "ExamReminderRun" (
    "id" TEXT NOT NULL,
    "datasetId" TEXT NOT NULL,
    "examDate" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "claimToken" TEXT,
    "leaseUntil" TIMESTAMP(3),
    "nextRunAt" TIMESTAMP(3),
    "summary" JSONB,
    "adminStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "adminError" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    CONSTRAINT "ExamReminderRun_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ExamReminderDelivery" (
    "datasetId" TEXT NOT NULL,
    "roll" TEXT NOT NULL,
    "examDate" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "claimToken" TEXT,
    "leaseUntil" TIMESTAMP(3),
    "nextRetryAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "messageId" TEXT,
    "lastError" TEXT,
    "uncertain" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ExamReminderDelivery_pkey" PRIMARY KEY ("datasetId", "roll", "examDate")
);
CREATE INDEX "ExamReminderRun_datasetId_examDate_idx" ON "ExamReminderRun"("datasetId", "examDate");
CREATE INDEX "ExamReminderDelivery_status_nextRetryAt_idx" ON "ExamReminderDelivery"("status", "nextRetryAt");
