-- Add sourceType to distinguish hosted files from external links
ALTER TABLE "research_vault"."ResearchResource"
  ADD COLUMN IF NOT EXISTS "sourceType" TEXT NOT NULL DEFAULT 'FILE';

-- Backfill: resources with a URL and no file are external links
UPDATE "research_vault"."ResearchResource"
SET "sourceType" = 'EXTERNAL_LINK'
WHERE "url" IS NOT NULL AND "filePath" IS NULL;

-- Custom research areas submitted by users (admin review queue)
CREATE TABLE "research_vault"."CustomResearchArea" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "resourceId" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CustomResearchArea_pkey" PRIMARY KEY ("id")
);

-- One custom area per resource (the modal allows a single "Other" tag)
CREATE UNIQUE INDEX "CustomResearchArea_resourceId_key" ON "research_vault"."CustomResearchArea"("resourceId");

CREATE INDEX "CustomResearchArea_status_idx" ON "research_vault"."CustomResearchArea"("status");

ALTER TABLE "research_vault"."CustomResearchArea"
  ADD CONSTRAINT "CustomResearchArea_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "research_vault"."ResearchResource"("id") ON DELETE SET NULL ON UPDATE CASCADE;
