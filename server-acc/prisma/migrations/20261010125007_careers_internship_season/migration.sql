-- AlterTable
ALTER TABLE "Posting" ADD COLUMN     "durationMonths" INTEGER,
ADD COLUMN     "season" TEXT,
ADD COLUMN     "startMonth" TIMESTAMP(3);
