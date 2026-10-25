-- CreateEnum
CREATE TYPE "ResearchResourceType" AS ENUM ('GUIDE', 'PAPER', 'TEMPLATE', 'EXPERIENCE');

-- CreateEnum
CREATE TYPE "ResourceStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "OpeningStatus" AS ENUM ('OPEN', 'CLOSED');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'RESEARCH_ADMIN';

-- CreateTable
CREATE TABLE "FacultyProfile" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "designation" TEXT,
    "department" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "officeLocation" TEXT,
    "photoUrl" TEXT,
    "websiteUrl" TEXT,
    "personalWebsiteUrl" TEXT,
    "googleScholarUrl" TEXT,
    "linkedinUrl" TEXT,
    "biography" TEXT,
    "publications" TEXT,
    "researchAreas" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "profileViewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FacultyProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchOpenPosition" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "positionType" TEXT NOT NULL DEFAULT 'RA',
    "requirements" TEXT,
    "eligibility" TEXT,
    "positionsAvailable" INTEGER NOT NULL DEFAULT 1,
    "positionsFilled" INTEGER NOT NULL DEFAULT 0,
    "status" "OpeningStatus" NOT NULL DEFAULT 'OPEN',
    "deadline" TIMESTAMP(3),
    "applicationUrl" TEXT,
    "howToApply" TEXT,
    "researchAreas" TEXT[],
    "bookmarkedUserIds" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "facultyId" INTEGER,
    "uploadedById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResearchOpenPosition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchResource" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "ResearchResourceType" NOT NULL DEFAULT 'GUIDE',
    "content" TEXT,
    "meta" JSONB,
    "url" TEXT,
    "filePath" TEXT,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "format" TEXT,
    "sourceType" TEXT NOT NULL DEFAULT 'FILE',
    "status" "ResourceStatus" NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "consentConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "researchAreas" TEXT[],
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "facultyId" INTEGER,
    "uploadedById" INTEGER,
    "approvedById" INTEGER,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResearchResource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchDiscussion" (
    "id" SERIAL NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "researchAreas" TEXT[],
    "upvotes" INTEGER NOT NULL DEFAULT 0,
    "voterIds" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "resourceId" INTEGER,
    "parentId" INTEGER,
    "authorId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResearchDiscussion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FacultyProfile_slug_key" ON "FacultyProfile"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "FacultyProfile_email_key" ON "FacultyProfile"("email");

-- CreateIndex
CREATE INDEX "FacultyProfile_department_idx" ON "FacultyProfile"("department");

-- CreateIndex
CREATE INDEX "FacultyProfile_researchAreas_idx" ON "FacultyProfile" USING GIN ("researchAreas");

-- CreateIndex
CREATE INDEX "ResearchOpenPosition_facultyId_idx" ON "ResearchOpenPosition"("facultyId");

-- CreateIndex
CREATE INDEX "ResearchOpenPosition_status_deadline_idx" ON "ResearchOpenPosition"("status", "deadline");

-- CreateIndex
CREATE INDEX "ResearchOpenPosition_researchAreas_idx" ON "ResearchOpenPosition" USING GIN ("researchAreas");

-- CreateIndex
CREATE INDEX "ResearchResource_status_type_idx" ON "ResearchResource"("status", "type");

-- CreateIndex
CREATE INDEX "ResearchResource_facultyId_idx" ON "ResearchResource"("facultyId");

-- CreateIndex
CREATE INDEX "ResearchResource_researchAreas_idx" ON "ResearchResource" USING GIN ("researchAreas");

-- CreateIndex
CREATE INDEX "ResearchDiscussion_resourceId_idx" ON "ResearchDiscussion"("resourceId");

-- CreateIndex
CREATE INDEX "ResearchDiscussion_parentId_createdAt_idx" ON "ResearchDiscussion"("parentId", "createdAt");

-- CreateIndex
CREATE INDEX "ResearchDiscussion_researchAreas_idx" ON "ResearchDiscussion" USING GIN ("researchAreas");

-- AddForeignKey
ALTER TABLE "ResearchOpenPosition" ADD CONSTRAINT "ResearchOpenPosition_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "FacultyProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchOpenPosition" ADD CONSTRAINT "ResearchOpenPosition_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchResource" ADD CONSTRAINT "ResearchResource_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "FacultyProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchResource" ADD CONSTRAINT "ResearchResource_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchResource" ADD CONSTRAINT "ResearchResource_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchDiscussion" ADD CONSTRAINT "ResearchDiscussion_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "ResearchResource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchDiscussion" ADD CONSTRAINT "ResearchDiscussion_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ResearchDiscussion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchDiscussion" ADD CONSTRAINT "ResearchDiscussion_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
