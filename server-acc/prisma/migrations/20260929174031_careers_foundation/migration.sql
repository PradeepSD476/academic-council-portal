-- CreateEnum
CREATE TYPE "CompanyStatus" AS ENUM ('ACTIVE', 'CANDIDATE', 'MERGED');

-- CreateEnum
CREATE TYPE "AliasOrigin" AS ENUM ('SEED', 'MANUAL', 'AUTO', 'MERGE');

-- CreateEnum
CREATE TYPE "MergeAction" AS ENUM ('MERGE', 'SPLIT');

-- AlterTable
ALTER TABLE "Experience" ADD COLUMN     "companyId" INTEGER;

-- CreateTable
CREATE TABLE "Company" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "website" TEXT,
    "status" "CompanyStatus" NOT NULL DEFAULT 'ACTIVE',
    "mergedIntoId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyAlias" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "alias" TEXT NOT NULL,
    "normalizedAlias" TEXT NOT NULL,
    "origin" "AliasOrigin" NOT NULL DEFAULT 'AUTO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompanyAlias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyMergeLog" (
    "id" SERIAL NOT NULL,
    "action" "MergeAction" NOT NULL,
    "fromCompanyId" INTEGER NOT NULL,
    "toCompanyId" INTEGER NOT NULL,
    "moved" JSONB NOT NULL,
    "performedById" INTEGER NOT NULL,
    "undoneAt" TIMESTAMP(3),
    "undoneById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompanyMergeLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppSetting" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedById" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppSetting_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "Company_slug_key" ON "Company"("slug");

-- CreateIndex
CREATE INDEX "Company_normalizedName_idx" ON "Company"("normalizedName");

-- CreateIndex
CREATE INDEX "Company_status_idx" ON "Company"("status");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyAlias_normalizedAlias_key" ON "CompanyAlias"("normalizedAlias");

-- CreateIndex
CREATE INDEX "CompanyAlias_companyId_idx" ON "CompanyAlias"("companyId");

-- CreateIndex
CREATE INDEX "CompanyMergeLog_fromCompanyId_idx" ON "CompanyMergeLog"("fromCompanyId");

-- CreateIndex
CREATE INDEX "CompanyMergeLog_toCompanyId_idx" ON "CompanyMergeLog"("toCompanyId");

-- CreateIndex
CREATE INDEX "Experience_companyId_idx" ON "Experience"("companyId");

-- AddForeignKey
ALTER TABLE "Experience" ADD CONSTRAINT "Experience_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyAlias" ADD CONSTRAINT "CompanyAlias_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
