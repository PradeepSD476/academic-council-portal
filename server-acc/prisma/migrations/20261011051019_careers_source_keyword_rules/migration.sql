-- AlterTable
ALTER TABLE "Source" ADD COLUMN     "excludeTitleKeywords" TEXT[],
ADD COLUMN     "includeTitleKeywords" TEXT[];

-- AlterTable
ALTER TABLE "SourceRun" ADD COLUMN     "droppedBySourceRules" INTEGER;
