-- Rename niche lesson icons to generic lesson-type symbols on the course path.
ALTER TYPE "LessonIcon" RENAME VALUE 'CODE' TO 'PRACTICE';
ALTER TYPE "LessonIcon" RENAME VALUE 'CHART' TO 'QUIZ';
ALTER TYPE "LessonIcon" RENAME VALUE 'TROPHY' TO 'MILESTONE';
