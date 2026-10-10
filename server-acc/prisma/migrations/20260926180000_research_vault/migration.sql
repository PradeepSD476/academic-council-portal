CREATE SCHEMA "research_vault";

ALTER TYPE "public"."Role" ADD VALUE 'RESEARCH_ADMIN';

CREATE TABLE "research_vault"."ResearchArea" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ResearchArea_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "research_vault"."FacultyProfile" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "designation" TEXT,
    "department" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "photoURL" TEXT,
    "website" TEXT,
    "biography" TEXT,
    "publications" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "profileViewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "FacultyProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "research_vault"."FacultyProfileResearchArea" (
    "facultyProfileId" INTEGER NOT NULL,
    "researchAreaId" INTEGER NOT NULL,
    CONSTRAINT "FacultyProfileResearchArea_pkey" PRIMARY KEY ("facultyProfileId", "researchAreaId")
);

CREATE TABLE "research_vault"."StudentResearchExperience" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "labName" TEXT,
    "guideName" TEXT,
    "duration" TEXT,
    "prerequisites" TEXT,
    "keyLearnings" TEXT,
    "outcome" TEXT,
    "status" "public"."ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "facultyId" INTEGER,
    "uploadedById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "StudentResearchExperience_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "research_vault"."StudentResearchExperienceResearchArea" (
    "experienceId" INTEGER NOT NULL,
    "researchAreaId" INTEGER NOT NULL,
    CONSTRAINT "StudentResearchExperienceResearchArea_pkey" PRIMARY KEY ("experienceId", "researchAreaId")
);

CREATE TABLE "research_vault"."ResearchExperienceLike" (
    "id" SERIAL NOT NULL,
    "experienceId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    CONSTRAINT "ResearchExperienceLike_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "research_vault"."ResearchExperienceBookmark" (
    "id" SERIAL NOT NULL,
    "experienceId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    CONSTRAINT "ResearchExperienceBookmark_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "research_vault"."ResearchDiscussion" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "uploadedById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ResearchDiscussion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "research_vault"."ResearchDiscussionResearchArea" (
    "discussionId" INTEGER NOT NULL,
    "researchAreaId" INTEGER NOT NULL,
    CONSTRAINT "ResearchDiscussionResearchArea_pkey" PRIMARY KEY ("discussionId", "researchAreaId")
);

CREATE TABLE "research_vault"."ResearchDiscussionReply" (
    "id" SERIAL NOT NULL,
    "content" TEXT NOT NULL,
    "discussionId" INTEGER NOT NULL,
    "parentId" INTEGER,
    "uploadedById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ResearchDiscussionReply_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "research_vault"."ResearchDiscussionVote" (
    "id" SERIAL NOT NULL,
    "discussionId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "ResearchDiscussionVote_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "research_vault"."ResearchReplyVote" (
    "id" SERIAL NOT NULL,
    "replyId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "ResearchReplyVote_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "research_vault"."ResearchResource" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT,
    "filePath" TEXT,
    "resourceType" TEXT NOT NULL DEFAULT 'GUIDE',
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "uploadedById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ResearchResource_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "research_vault"."ResearchResourceResearchArea" (
    "resourceId" INTEGER NOT NULL,
    "researchAreaId" INTEGER NOT NULL,
    CONSTRAINT "ResearchResourceResearchArea_pkey" PRIMARY KEY ("resourceId", "researchAreaId")
);

CREATE TABLE "research_vault"."ResearchOpenPosition" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "positionType" TEXT NOT NULL DEFAULT 'RA',
    "eligibility" TEXT,
    "applicationUrl" TEXT,
    "deadline" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "facultyId" INTEGER,
    "uploadedById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ResearchOpenPosition_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "research_vault"."ResearchInterest" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "department" TEXT,
    "subArea" TEXT,
    "projectType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ResearchInterest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "research_vault"."ResearchFacultyFollow" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "facultyProfileId" INTEGER NOT NULL,
    CONSTRAINT "ResearchFacultyFollow_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "research_vault"."ResearchAreaFollow" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "researchAreaId" INTEGER NOT NULL,
    CONSTRAINT "ResearchAreaFollow_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ResearchArea_name_key" ON "research_vault"."ResearchArea"("name");
CREATE UNIQUE INDEX "ResearchArea_slug_key" ON "research_vault"."ResearchArea"("slug");
CREATE UNIQUE INDEX "FacultyProfile_slug_key" ON "research_vault"."FacultyProfile"("slug");
CREATE UNIQUE INDEX "ResearchExperienceLike_experienceId_userId_key" ON "research_vault"."ResearchExperienceLike"("experienceId", "userId");
CREATE UNIQUE INDEX "ResearchExperienceBookmark_experienceId_userId_key" ON "research_vault"."ResearchExperienceBookmark"("experienceId", "userId");
CREATE UNIQUE INDEX "ResearchDiscussionVote_discussionId_userId_key" ON "research_vault"."ResearchDiscussionVote"("discussionId", "userId");
CREATE UNIQUE INDEX "ResearchReplyVote_replyId_userId_key" ON "research_vault"."ResearchReplyVote"("replyId", "userId");
CREATE UNIQUE INDEX "ResearchInterest_userId_key" ON "research_vault"."ResearchInterest"("userId");
CREATE UNIQUE INDEX "ResearchFacultyFollow_userId_facultyProfileId_key" ON "research_vault"."ResearchFacultyFollow"("userId", "facultyProfileId");
CREATE UNIQUE INDEX "ResearchAreaFollow_userId_researchAreaId_key" ON "research_vault"."ResearchAreaFollow"("userId", "researchAreaId");

ALTER TABLE "research_vault"."FacultyProfileResearchArea" ADD CONSTRAINT "FacultyProfileResearchArea_facultyProfileId_fkey" FOREIGN KEY ("facultyProfileId") REFERENCES "research_vault"."FacultyProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "research_vault"."FacultyProfileResearchArea" ADD CONSTRAINT "FacultyProfileResearchArea_researchAreaId_fkey" FOREIGN KEY ("researchAreaId") REFERENCES "research_vault"."ResearchArea"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "research_vault"."StudentResearchExperience" ADD CONSTRAINT "StudentResearchExperience_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "research_vault"."FacultyProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "research_vault"."StudentResearchExperience" ADD CONSTRAINT "StudentResearchExperience_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "research_vault"."StudentResearchExperienceResearchArea" ADD CONSTRAINT "StudentResearchExperienceResearchArea_experienceId_fkey" FOREIGN KEY ("experienceId") REFERENCES "research_vault"."StudentResearchExperience"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "research_vault"."StudentResearchExperienceResearchArea" ADD CONSTRAINT "StudentResearchExperienceResearchArea_researchAreaId_fkey" FOREIGN KEY ("researchAreaId") REFERENCES "research_vault"."ResearchArea"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "research_vault"."ResearchExperienceLike" ADD CONSTRAINT "ResearchExperienceLike_experienceId_fkey" FOREIGN KEY ("experienceId") REFERENCES "research_vault"."StudentResearchExperience"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "research_vault"."ResearchExperienceLike" ADD CONSTRAINT "ResearchExperienceLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "research_vault"."ResearchExperienceBookmark" ADD CONSTRAINT "ResearchExperienceBookmark_experienceId_fkey" FOREIGN KEY ("experienceId") REFERENCES "research_vault"."StudentResearchExperience"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "research_vault"."ResearchExperienceBookmark" ADD CONSTRAINT "ResearchExperienceBookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "research_vault"."ResearchDiscussion" ADD CONSTRAINT "ResearchDiscussion_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "research_vault"."ResearchDiscussionResearchArea" ADD CONSTRAINT "ResearchDiscussionResearchArea_discussionId_fkey" FOREIGN KEY ("discussionId") REFERENCES "research_vault"."ResearchDiscussion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "research_vault"."ResearchDiscussionResearchArea" ADD CONSTRAINT "ResearchDiscussionResearchArea_researchAreaId_fkey" FOREIGN KEY ("researchAreaId") REFERENCES "research_vault"."ResearchArea"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "research_vault"."ResearchDiscussionReply" ADD CONSTRAINT "ResearchDiscussionReply_discussionId_fkey" FOREIGN KEY ("discussionId") REFERENCES "research_vault"."ResearchDiscussion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "research_vault"."ResearchDiscussionReply" ADD CONSTRAINT "ResearchDiscussionReply_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "research_vault"."ResearchDiscussionReply"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "research_vault"."ResearchDiscussionReply" ADD CONSTRAINT "ResearchDiscussionReply_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "research_vault"."ResearchDiscussionVote" ADD CONSTRAINT "ResearchDiscussionVote_discussionId_fkey" FOREIGN KEY ("discussionId") REFERENCES "research_vault"."ResearchDiscussion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "research_vault"."ResearchDiscussionVote" ADD CONSTRAINT "ResearchDiscussionVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "research_vault"."ResearchReplyVote" ADD CONSTRAINT "ResearchReplyVote_replyId_fkey" FOREIGN KEY ("replyId") REFERENCES "research_vault"."ResearchDiscussionReply"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "research_vault"."ResearchReplyVote" ADD CONSTRAINT "ResearchReplyVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "research_vault"."ResearchResource" ADD CONSTRAINT "ResearchResource_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "research_vault"."ResearchResourceResearchArea" ADD CONSTRAINT "ResearchResourceResearchArea_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "research_vault"."ResearchResource"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "research_vault"."ResearchResourceResearchArea" ADD CONSTRAINT "ResearchResourceResearchArea_researchAreaId_fkey" FOREIGN KEY ("researchAreaId") REFERENCES "research_vault"."ResearchArea"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "research_vault"."ResearchOpenPosition" ADD CONSTRAINT "ResearchOpenPosition_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "research_vault"."FacultyProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "research_vault"."ResearchOpenPosition" ADD CONSTRAINT "ResearchOpenPosition_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "research_vault"."ResearchInterest" ADD CONSTRAINT "ResearchInterest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "research_vault"."ResearchFacultyFollow" ADD CONSTRAINT "ResearchFacultyFollow_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "research_vault"."ResearchFacultyFollow" ADD CONSTRAINT "ResearchFacultyFollow_facultyProfileId_fkey" FOREIGN KEY ("facultyProfileId") REFERENCES "research_vault"."FacultyProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "research_vault"."ResearchAreaFollow" ADD CONSTRAINT "ResearchAreaFollow_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "research_vault"."ResearchAreaFollow" ADD CONSTRAINT "ResearchAreaFollow_researchAreaId_fkey" FOREIGN KEY ("researchAreaId") REFERENCES "research_vault"."ResearchArea"("id") ON DELETE CASCADE ON UPDATE CASCADE;