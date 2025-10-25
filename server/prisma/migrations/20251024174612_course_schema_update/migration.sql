/*
  Warnings:

  - Added the required column `academicYear` to the `Course` table without a default value. This is not possible if the table is not empty.
  - Added the required column `branchName` to the `Course` table without a default value. This is not possible if the table is not empty.
  - Added the required column `program` to the `Course` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "academicYear" INTEGER NOT NULL,
ADD COLUMN     "branchName" TEXT NOT NULL,
ADD COLUMN     "program" "Program" NOT NULL;
