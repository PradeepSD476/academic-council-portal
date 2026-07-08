-- AlterEnum
ALTER TYPE "FinanceCategory" ADD VALUE 'FEE_REIMBURSEMENT';

-- AlterTable
ALTER TABLE "FinanceVault" ADD COLUMN     "state" TEXT[],
ADD COLUMN     "subCategory" TEXT[];
