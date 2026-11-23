CREATE TABLE "UserNotificationSettings" (
    "userId" INTEGER NOT NULL,
    "resourcesEnabled" BOOLEAN NOT NULL DEFAULT true,
    "careerVaultExperiencesEnabled" BOOLEAN NOT NULL DEFAULT true,
    "jobsInternshipsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "announcementsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "UserNotificationSettings_pkey" PRIMARY KEY ("userId"),
    CONSTRAINT "UserNotificationSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE "JobPublicationNotification" (
    "postingId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "audienceCursor" INTEGER NOT NULL DEFAULT 0,
    "audienceComplete" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "JobPublicationNotification_pkey" PRIMARY KEY ("postingId"),
    CONSTRAINT "JobPublicationNotification_postingId_fkey" FOREIGN KEY ("postingId") REFERENCES "Posting"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE "JobPublicationDelivery" (
    "postingId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "claimToken" TEXT,
    "leaseUntil" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "lastError" TEXT,
    CONSTRAINT "JobPublicationDelivery_pkey" PRIMARY KEY ("postingId", "userId"),
    CONSTRAINT "JobPublicationDelivery_postingId_fkey" FOREIGN KEY ("postingId") REFERENCES "JobPublicationNotification"("postingId") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "JobPublicationDelivery_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "JobPublicationNotification_status_createdAt_idx" ON "JobPublicationNotification"("status", "createdAt");
CREATE INDEX "JobPublicationDelivery_status_nextAttemptAt_idx" ON "JobPublicationDelivery"("status", "nextAttemptAt");
