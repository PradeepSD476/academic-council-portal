-- CreateEnum
CREATE TYPE "FinanceCategory" AS ENUM ('SCHOLARSHIP', 'FEE_WAIVER', 'EDUCATION_LOAN', 'FINANCIAL_ASSISTANCE', 'GRANT', 'OTHER');

-- CreateEnum
CREATE TYPE "GenderEligibility" AS ENUM ('ALL', 'MALE', 'FEMALE');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'FINANCE_ADMIN';

-- CreateTable
CREATE TABLE "FinanceVault" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "FinanceCategory" NOT NULL,
    "provider" TEXT,
    "amount" TEXT,
    "eligibilityCriteria" TEXT,
    "incomeEligibility" TEXT,
    "genderEligibility" "GenderEligibility" NOT NULL DEFAULT 'ALL',
    "applicableBranch" TEXT[],
    "academicYear" TEXT,
    "deadline" TIMESTAMP(3),
    "applicationUrl" TEXT,
    "officialWebsite" TEXT,
    "requiredDocuments" TEXT,
    "attachments" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinanceVault_pkey" PRIMARY KEY ("id")
);
