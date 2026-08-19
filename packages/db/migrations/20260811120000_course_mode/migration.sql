-- A LESSON course holds exactly one lesson and opens straight into it.
-- Every existing row is a course, which is what the default says.
CREATE TYPE "CourseMode" AS ENUM ('COURSE', 'LESSON');

ALTER TABLE "course"
ADD COLUMN "mode" "CourseMode" NOT NULL DEFAULT 'COURSE';
