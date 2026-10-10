-- Apply instructions text column
ALTER TABLE "research_vault"."ResearchOpenPosition"
  ADD COLUMN IF NOT EXISTS "applicationInstructions" TEXT;

-- Join table: positions <-> research areas
CREATE TABLE "research_vault"."ResearchOpenPositionResearchArea" (
    "positionId" INTEGER NOT NULL,
    "researchAreaId" INTEGER NOT NULL,
    CONSTRAINT "ResearchOpenPositionResearchArea_pkey" PRIMARY KEY ("positionId","researchAreaId")
);

ALTER TABLE "research_vault"."ResearchOpenPositionResearchArea"
  ADD CONSTRAINT "ResearchOpenPositionResearchArea_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "research_vault"."ResearchOpenPosition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "research_vault"."ResearchOpenPositionResearchArea"
  ADD CONSTRAINT "ResearchOpenPositionResearchArea_researchAreaId_fkey" FOREIGN KEY ("researchAreaId") REFERENCES "research_vault"."ResearchArea"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "ResearchOpenPositionResearchArea_researchAreaId_idx" ON "research_vault"."ResearchOpenPositionResearchArea"("researchAreaId");

-- Per-user position bookmarks
CREATE TABLE "research_vault"."ResearchOpenPositionBookmark" (
    "id" SERIAL NOT NULL,
    "positionId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ResearchOpenPositionBookmark_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ResearchOpenPositionBookmark_positionId_userId_key" ON "research_vault"."ResearchOpenPositionBookmark"("positionId", "userId");

ALTER TABLE "research_vault"."ResearchOpenPositionBookmark"
  ADD CONSTRAINT "ResearchOpenPositionBookmark_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "research_vault"."ResearchOpenPosition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "research_vault"."ResearchOpenPositionBookmark"
  ADD CONSTRAINT "ResearchOpenPositionBookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
