-- CreateEnum
CREATE TYPE "LessonIcon" AS ENUM ('BOOK', 'LIGHTBULB', 'CODE', 'CHART', 'TROPHY');

-- AlterTable
ALTER TABLE "lesson" ADD COLUMN "icon" "LessonIcon" NOT NULL DEFAULT 'BOOK';
