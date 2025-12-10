-- This is an empty migration.

ALTER TABLE "Course"
RENAME COLUMN "branchName" TO "allowedBranch";
