-- CreateEnum
CREATE TYPE "ExpiryReason" AS ENUM ('BOARD', 'ADMIN', 'DEADLINE');

-- AlterTable
ALTER TABLE "Posting" ADD COLUMN     "expiredReason" "ExpiryReason";
