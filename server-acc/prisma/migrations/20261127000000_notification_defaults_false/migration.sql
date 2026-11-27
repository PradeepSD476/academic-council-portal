-- Change defaults for future rows only. Existing user preferences are preserved.
ALTER TABLE "UserNotificationSettings"
    ALTER COLUMN "resourcesEnabled" SET DEFAULT false,
    ALTER COLUMN "careerVaultExperiencesEnabled" SET DEFAULT false,
    ALTER COLUMN "jobsInternshipsEnabled" SET DEFAULT false,
    ALTER COLUMN "announcementsEnabled" SET DEFAULT false;
