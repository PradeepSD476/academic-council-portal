-- External guides: experiences completed under mentors outside our faculty
-- directory (other institutes, industry, external labs). Nullable columns --
-- mutually exclusive with the facultyId link, enforced in the controller.
ALTER TABLE "research_vault"."StudentResearchExperience"
  ADD COLUMN "externalGuideName" TEXT,
  ADD COLUMN "externalGuideAffiliation" TEXT;
