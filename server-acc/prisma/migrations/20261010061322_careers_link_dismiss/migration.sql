-- AlterTable
ALTER TABLE "LinkSubmission" ADD COLUMN     "dismissReason" TEXT,
ADD COLUMN     "dismissedAt" TIMESTAMP(3),
ADD COLUMN     "dismissedById" INTEGER;
