-- Add ResourceStatus enum
CREATE TYPE "research_vault"."ResourceStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- Add new columns to ResearchResource
ALTER TABLE "research_vault"."ResearchResource"
  ADD COLUMN IF NOT EXISTS "status" "research_vault"."ResourceStatus" NOT NULL DEFAULT 'APPROVED',
  ADD COLUMN IF NOT EXISTS "format" TEXT,
  ADD COLUMN IF NOT EXISTS "fileSize" INTEGER,
  ADD COLUMN IF NOT EXISTS "mimeType" TEXT,
  ADD COLUMN IF NOT EXISTS "rejection_reason" TEXT,
  ADD COLUMN IF NOT EXISTS "consent_confirmed" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "approvedById" INTEGER,
  ADD COLUMN IF NOT EXISTS "reviewedAt" TIMESTAMP(3);

-- Update existing resources to have consent_confirmed = true
UPDATE "research_vault"."ResearchResource" SET "consent_confirmed" = true WHERE "consent_confirmed" = false;

-- Add foreign key for approvedById
ALTER TABLE "research_vault"."ResearchResource"
  ADD CONSTRAINT "ResearchResource_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create ResourceView table
CREATE TABLE "research_vault"."ResourceView" (
    "id" SERIAL NOT NULL,
    "resourceId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ResourceView_pkey" PRIMARY KEY ("id")
);

-- Add unique constraint on resourceId + userId
CREATE UNIQUE INDEX "ResourceView_resourceId_userId_key" ON "research_vault"."ResourceView"("resourceId", "userId");

-- Add indexes
CREATE INDEX "ResourceView_resourceId_idx" ON "research_vault"."ResourceView"("resourceId");
CREATE INDEX "ResourceView_userId_idx" ON "research_vault"."ResourceView"("userId");

-- Add foreign keys
ALTER TABLE "research_vault"."ResourceView"
  ADD CONSTRAINT "ResourceView_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "research_vault"."ResearchResource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "research_vault"."ResourceView"
  ADD CONSTRAINT "ResourceView_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;