/*
  Warnings:

  - You are about to drop the column `avatar` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `isAdminStudent` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `isFaculty` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `isStudent` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `isSuperAdmin` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `User` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('STUDENT', 'FACULTY', 'STUDENT_ADMIN', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "Program" AS ENUM ('MTECH', 'BTECH', 'PHD', 'MSC');

-- CreateEnum
CREATE TYPE "ResourceType" AS ENUM ('NOTES', 'PYQ', 'TUTORIAL', 'LAB_ASSIGNMENT', 'LAB_MANUAL', 'BOOK', 'LECTURE_SLIDE', 'ASSIGNMENT');

-- AlterTable
ALTER TABLE "User" DROP COLUMN "avatar",
DROP COLUMN "isAdminStudent",
DROP COLUMN "isFaculty",
DROP COLUMN "isStudent",
DROP COLUMN "isSuperAdmin",
DROP COLUMN "name",
ADD COLUMN     "admissionYear" INTEGER,
ADD COLUMN     "branchName" TEXT,
ADD COLUMN     "displayName" TEXT,
ADD COLUMN     "photoURL" TEXT,
ADD COLUMN     "program" "Program",
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'STUDENT',
ADD COLUMN     "rollNo" TEXT;

-- CreateTable
CREATE TABLE "Course" (
    "id" SERIAL NOT NULL,
    "courseCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Resource" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "fileURL" TEXT NOT NULL,
    "resourceType" "ResourceType" NOT NULL,
    "uploadedById" INTEGER,
    "courseId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Resource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Announcement" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "isFileAttached" BOOLEAN NOT NULL DEFAULT false,
    "fileURL" TEXT,
    "uploadedById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Course_courseCode_key" ON "Course"("courseCode");

-- AddForeignKey
ALTER TABLE "Resource" ADD CONSTRAINT "Resource_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resource" ADD CONSTRAINT "Resource_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
