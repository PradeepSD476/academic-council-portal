-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ResourceType" ADD VALUE 'PROJECT';
ALTER TYPE "ResourceType" ADD VALUE 'SYLLABUS';
ALTER TYPE "ResourceType" ADD VALUE 'QUESTION_BANK';
ALTER TYPE "ResourceType" ADD VALUE 'REFERENCE_MATERIAL';
ALTER TYPE "ResourceType" ADD VALUE 'PRESENTATION';
ALTER TYPE "ResourceType" ADD VALUE 'VIDEO_LECTURE';
ALTER TYPE "ResourceType" ADD VALUE 'SOFTWARE';
ALTER TYPE "ResourceType" ADD VALUE 'DATASET';
ALTER TYPE "ResourceType" ADD VALUE 'READING_MATERIAL';
ALTER TYPE "ResourceType" ADD VALUE 'CASE_STUDY';
ALTER TYPE "ResourceType" ADD VALUE 'EXAM_NOTICE';
ALTER TYPE "ResourceType" ADD VALUE 'TIME_TABLE';
ALTER TYPE "ResourceType" ADD VALUE 'OTHER';
