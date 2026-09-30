-- CreateEnum
CREATE TYPE "SourceKind" AS ENUM ('GREENHOUSE', 'LEVER', 'ASHBY', 'MANUAL', 'STUDENT_LINK');

-- CreateEnum
CREATE TYPE "SourceHealth" AS ENUM ('UNKNOWN', 'OK', 'FAILING', 'ZERO_RESULTS', 'DISABLED');

-- CreateEnum
CREATE TYPE "RunStatus" AS ENUM ('RUNNING', 'SUCCESS', 'FAILED');

-- CreateEnum
CREATE TYPE "PostingType" AS ENUM ('INTERNSHIP', 'FULL_TIME', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "WorkMode" AS ENUM ('ONSITE', 'HYBRID', 'REMOTE', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "Disclosure" AS ENUM ('DISCLOSED', 'RANGE', 'NOT_DISCLOSED', 'UNCLEAR');

-- CreateEnum
CREATE TYPE "PostingStatus" AS ENUM ('PENDING_REVIEW', 'LIVE', 'EXPIRED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ExtractionTier" AS ENUM ('STRUCTURED', 'JSON_LD', 'LLM_FAST', 'LLM_STRONG', 'MANUAL');

-- CreateEnum
CREATE TYPE "ExtractionState" AS ENUM ('QUEUED', 'DONE', 'FAILED', 'SKIPPED_BUDGET');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('RECEIVED', 'PROCESSING', 'EXTRACTING', 'PENDING_REVIEW', 'STORED_ONLY', 'DUPLICATE', 'FAILED');

-- CreateEnum
CREATE TYPE "ReviewAction" AS ENUM ('APPROVE', 'REJECT', 'EDIT', 'EXPIRE', 'REOPEN', 'CREATE_MANUAL');

-- CreateTable
CREATE TABLE "Source" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "SourceKind" NOT NULL,
    "boardToken" TEXT,
    "companyId" INTEGER,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "health" "SourceHealth" NOT NULL DEFAULT 'UNKNOWN',
    "lastRunAt" TIMESTAMP(3),
    "lastSuccessAt" TIMESTAMP(3),
    "lastFetchedCount" INTEGER,
    "lastKeptCount" INTEGER,
    "consecutiveFailures" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Source_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SourceRun" (
    "id" SERIAL NOT NULL,
    "sourceId" INTEGER NOT NULL,
    "status" "RunStatus" NOT NULL DEFAULT 'RUNNING',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "fetchedCount" INTEGER NOT NULL DEFAULT 0,
    "keptCount" INTEGER NOT NULL DEFAULT 0,
    "newCount" INTEGER NOT NULL DEFAULT 0,
    "duplicateCount" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,

    CONSTRAINT "SourceRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Posting" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "roleTitle" TEXT NOT NULL,
    "roleTitleNormalized" TEXT NOT NULL,
    "type" "PostingType" NOT NULL DEFAULT 'UNKNOWN',
    "ppoMentioned" BOOLEAN,
    "location" TEXT,
    "locationNormalized" TEXT,
    "workMode" "WorkMode" NOT NULL DEFAULT 'UNKNOWN',
    "skills" TEXT[],
    "compCurrency" TEXT NOT NULL DEFAULT 'INR',
    "stipendMin" INTEGER,
    "stipendMax" INTEGER,
    "stipendDisclosure" "Disclosure" NOT NULL DEFAULT 'NOT_DISCLOSED',
    "ctcMin" INTEGER,
    "ctcMax" INTEGER,
    "ctcDisclosure" "Disclosure" NOT NULL DEFAULT 'NOT_DISCLOSED',
    "compensationRaw" TEXT,
    "descriptionText" TEXT NOT NULL,
    "contentFingerprint" TEXT NOT NULL,
    "applyUrl" TEXT NOT NULL,
    "eligibleBranches" TEXT[],
    "eligibleYears" INTEGER[],
    "minCpi" DECIMAL(4,2),
    "deadlineStated" TIMESTAMP(3),
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenLiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "PostingStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "extractionTier" "ExtractionTier" NOT NULL,
    "extractionConfidence" DOUBLE PRECISION,
    "uncertainFields" TEXT[],
    "rejectReason" TEXT,
    "reviewedById" INTEGER,
    "reviewedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Posting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostingSource" (
    "id" SERIAL NOT NULL,
    "postingId" INTEGER NOT NULL,
    "sourceId" INTEGER NOT NULL,
    "externalId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isLive" BOOLEAN NOT NULL DEFAULT true,
    "missedRuns" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PostingSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostingReview" (
    "id" SERIAL NOT NULL,
    "postingId" INTEGER NOT NULL,
    "action" "ReviewAction" NOT NULL,
    "byUserId" INTEGER NOT NULL,
    "changes" JSONB,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostingReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LinkSubmission" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "canonicalUrl" TEXT NOT NULL,
    "note" TEXT,
    "submittedById" INTEGER NOT NULL,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'RECEIVED',
    "postingId" INTEGER,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LinkSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Extraction" (
    "id" SERIAL NOT NULL,
    "submissionId" INTEGER,
    "postingId" INTEGER,
    "tier" "ExtractionTier" NOT NULL,
    "state" "ExtractionState" NOT NULL DEFAULT 'QUEUED',
    "model" TEXT,
    "inputText" TEXT NOT NULL,
    "inputTruncated" BOOLEAN NOT NULL DEFAULT false,
    "sourceUrl" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "output" JSONB,
    "confidence" DOUBLE PRECISION,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Extraction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LlmUsage" (
    "id" SERIAL NOT NULL,
    "model" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "batched" BOOLEAN NOT NULL DEFAULT false,
    "inputTokens" INTEGER NOT NULL,
    "outputTokens" INTEGER NOT NULL,
    "costUsd" DECIMAL(10,6) NOT NULL,
    "extractionId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LlmUsage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Source_companyId_idx" ON "Source"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Source_kind_boardToken_key" ON "Source"("kind", "boardToken");

-- CreateIndex
CREATE INDEX "SourceRun_sourceId_startedAt_idx" ON "SourceRun"("sourceId", "startedAt");

-- CreateIndex
CREATE INDEX "Posting_status_lastSeenLiveAt_idx" ON "Posting"("status", "lastSeenLiveAt");

-- CreateIndex
CREATE INDEX "Posting_companyId_status_idx" ON "Posting"("companyId", "status");

-- CreateIndex
CREATE INDEX "Posting_companyId_roleTitleNormalized_idx" ON "Posting"("companyId", "roleTitleNormalized");

-- CreateIndex
CREATE INDEX "Posting_contentFingerprint_idx" ON "Posting"("contentFingerprint");

-- CreateIndex
CREATE INDEX "PostingSource_postingId_idx" ON "PostingSource"("postingId");

-- CreateIndex
CREATE UNIQUE INDEX "PostingSource_sourceId_externalId_key" ON "PostingSource"("sourceId", "externalId");

-- CreateIndex
CREATE INDEX "PostingReview_postingId_idx" ON "PostingReview"("postingId");

-- CreateIndex
CREATE INDEX "LinkSubmission_submittedById_createdAt_idx" ON "LinkSubmission"("submittedById", "createdAt");

-- CreateIndex
CREATE INDEX "LinkSubmission_status_idx" ON "LinkSubmission"("status");

-- CreateIndex
CREATE INDEX "LinkSubmission_canonicalUrl_idx" ON "LinkSubmission"("canonicalUrl");

-- CreateIndex
CREATE INDEX "Extraction_state_nextAttemptAt_idx" ON "Extraction"("state", "nextAttemptAt");

-- CreateIndex
CREATE INDEX "LlmUsage_createdAt_idx" ON "LlmUsage"("createdAt");

-- AddForeignKey
ALTER TABLE "Source" ADD CONSTRAINT "Source_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourceRun" ADD CONSTRAINT "SourceRun_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Posting" ADD CONSTRAINT "Posting_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostingSource" ADD CONSTRAINT "PostingSource_postingId_fkey" FOREIGN KEY ("postingId") REFERENCES "Posting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostingSource" ADD CONSTRAINT "PostingSource_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostingReview" ADD CONSTRAINT "PostingReview_postingId_fkey" FOREIGN KEY ("postingId") REFERENCES "Posting"("id") ON DELETE CASCADE ON UPDATE CASCADE;
