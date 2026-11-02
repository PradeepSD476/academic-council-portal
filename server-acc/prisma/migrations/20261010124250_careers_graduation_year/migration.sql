-- AlterTable
ALTER TABLE "Posting" ADD COLUMN     "eligibleGradYears" INTEGER[];

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "graduationYear" INTEGER,
ADD COLUMN     "programme" TEXT;
