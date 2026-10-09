-- Faculty profile links + structured openings data on the shared
-- ResearchOpenPosition table (user side is read-only; admin panel writes).
ALTER TABLE "research_vault"."FacultyProfile"
  ADD COLUMN "googleScholarUrl" TEXT,
  ADD COLUMN "linkedinUrl" TEXT,
  ADD COLUMN "personalWebsiteUrl" TEXT,
  ADD COLUMN "officeLocation" TEXT;

-- eligibility / deadline already existed; add the remaining openings fields.
ALTER TABLE "research_vault"."ResearchOpenPosition"
  ADD COLUMN "requirements" TEXT,
  ADD COLUMN "positionsAvailable" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "positionsFilled" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "howToApply" TEXT;

CREATE TYPE "research_vault"."OpeningStatus" AS ENUM ('OPEN', 'CLOSED');
ALTER TABLE "research_vault"."ResearchOpenPosition"
  ADD COLUMN "status" "research_vault"."OpeningStatus" NOT NULL DEFAULT 'OPEN';
