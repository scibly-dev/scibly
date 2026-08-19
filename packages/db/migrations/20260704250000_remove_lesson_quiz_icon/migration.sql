-- Quiz (multiple-choice style) is folded into Practice — one icon for applied learning.
UPDATE "lesson" SET icon = 'PRACTICE' WHERE icon = 'QUIZ';

CREATE TYPE "LessonIcon_new" AS ENUM ('BOOK', 'LIGHTBULB', 'PRACTICE', 'MILESTONE');

ALTER TABLE "lesson" ALTER COLUMN "icon" DROP DEFAULT;
ALTER TABLE "lesson"
  ALTER COLUMN "icon" TYPE "LessonIcon_new"
  USING (icon::text::"LessonIcon_new");

DROP TYPE "LessonIcon";
ALTER TYPE "LessonIcon_new" RENAME TO "LessonIcon";
ALTER TABLE "lesson" ALTER COLUMN "icon" SET DEFAULT 'BOOK';
