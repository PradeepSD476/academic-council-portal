-- Upgrade Experiences into moderated, full-article content.
-- Audit (2026-09-30): 1 row PUBLISHED, 0 DRAFT. Pure status rename: PUBLISHED
-- content stays public (now labeled APPROVED); nothing needs re-approval.
-- guideName: 1 row had a value ("Dr. Asha Rao (Demo)") but that row already
-- carries a facultyId link, so the free-text name is safely dropped.

CREATE TYPE "research_vault"."ExperienceStatus" AS ENUM ('PENDING_REVIEW', 'APPROVED', 'REJECTED');

ALTER TABLE "research_vault"."StudentResearchExperience" ADD COLUMN "summary" TEXT;
ALTER TABLE "research_vault"."StudentResearchExperience" ADD COLUMN "department" TEXT;
ALTER TABLE "research_vault"."StudentResearchExperience" ADD COLUMN "experienceType" TEXT;
ALTER TABLE "research_vault"."StudentResearchExperience" ADD COLUMN "reviewNote" TEXT;

ALTER TABLE "research_vault"."StudentResearchExperience" ADD COLUMN "status_new" "research_vault"."ExperienceStatus";
UPDATE "research_vault"."StudentResearchExperience" SET "status_new" =
  CASE
    WHEN status = 'PUBLISHED' THEN 'APPROVED'::"research_vault"."ExperienceStatus"
    ELSE 'PENDING_REVIEW'::"research_vault"."ExperienceStatus"
  END;
ALTER TABLE "research_vault"."StudentResearchExperience" ALTER COLUMN "status_new" SET DEFAULT 'PENDING_REVIEW';
ALTER TABLE "research_vault"."StudentResearchExperience" ALTER COLUMN "status_new" SET NOT NULL;
ALTER TABLE "research_vault"."StudentResearchExperience" DROP COLUMN status;
ALTER TABLE "research_vault"."StudentResearchExperience" RENAME COLUMN "status_new" TO status;

-- Carry the free-text guide name into the linked faculty where the link was
-- missing but the name exactly matches an existing profile (case-insensitive).
UPDATE "research_vault"."StudentResearchExperience" s
SET "facultyId" = f.id
FROM "research_vault"."FacultyProfile" f
WHERE s."facultyId" IS NULL
  AND s."guideName" IS NOT NULL AND trim(s."guideName") <> ''
  AND lower(f.name) = lower(trim(s."guideName"));

ALTER TABLE "research_vault"."StudentResearchExperience" DROP COLUMN "guideName";

-- Seed summaries from the first sentence of the narrative for existing rows.
UPDATE "research_vault"."StudentResearchExperience"
SET "summary" = substring(description from 1 for position('.' in description))
WHERE "summary" IS NULL
  AND position('.' in description) > 0;

CREATE TABLE "research_vault"."ResearchExperienceComment" (
    "id" SERIAL NOT NULL,
    "content" TEXT NOT NULL,
    "experienceId" INTEGER NOT NULL,
    "uploadedById" INTEGER NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "deletedById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResearchExperienceComment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ResearchExperienceComment_experienceId_createdAt_idx"
  ON "research_vault"."ResearchExperienceComment"("experienceId", "createdAt");

ALTER TABLE "research_vault"."ResearchExperienceComment" ADD CONSTRAINT "ResearchExperienceComment_experienceId_fkey"
  FOREIGN KEY ("experienceId") REFERENCES "research_vault"."StudentResearchExperience"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "research_vault"."ResearchExperienceComment" ADD CONSTRAINT "ResearchExperienceComment_uploadedById_fkey"
  FOREIGN KEY ("uploadedById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Deleted-comment audit: who removed it (author or admin).
ALTER TABLE "research_vault"."ResearchExperienceComment" ADD CONSTRAINT "ResearchExperienceComment_deletedById_fkey"
  FOREIGN KEY ("deletedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
