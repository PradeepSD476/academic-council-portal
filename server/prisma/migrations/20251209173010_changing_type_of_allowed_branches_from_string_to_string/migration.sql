-- This is an empty migration.

ALTER TABLE "Course"
ALTER COLUMN "allowedBranch" TYPE TEXT[]
USING ARRAY["allowedBranch"];
