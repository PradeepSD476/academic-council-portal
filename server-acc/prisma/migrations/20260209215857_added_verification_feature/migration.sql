-- CreateEnum
CREATE TYPE "VerificationType" AS ENUM ('EMAIL_VERIFICATION', 'PASSWORD_RESET', 'LOGIN_OTP');

-- CreateTable
CREATE TABLE "Verification" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "otpHash" TEXT NOT NULL,
    "type" "VerificationType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiringAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Verification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Verification_email_idx" ON "Verification"("email");

-- CreateIndex
CREATE INDEX "Verification_expiringAt_idx" ON "Verification"("expiringAt");
