-- Design is a lesson-wide setting now: one palette per lesson instead of one
-- per scene. Each lesson adopts the palette of its first scene that had one,
-- so nothing an author picked is lost.
ALTER TABLE "lesson" ADD COLUMN "design" JSONB;

UPDATE "lesson"
SET "design" = first_scene."design"
FROM (
  SELECT DISTINCT ON ("lessonId") "lessonId", "design"
  FROM "scene"
  WHERE "design" IS NOT NULL
  ORDER BY "lessonId", "order" ASC, "createdAt" ASC
) AS first_scene
WHERE first_scene."lessonId" = "lesson"."id";

-- Scenes created before the default palette moved off near-black carry
-- textColor/primaryColor #111827, which renders the CTA and the progress bar
-- black. Only rows holding the old default verbatim are rewritten -- a lesson
-- someone actually coloured never matches all three keys.
-- Drafts only: published lessons are immutable and pick this up on republish.
UPDATE "lesson"
SET "design" = jsonb_set(
  jsonb_set("design", '{textColor}', '"#131c46"'),
  '{primaryColor}',
  '"#0066ff"'
)
WHERE "courseVersionId" IS NULL
  AND jsonb_typeof("design") = 'object'
  AND "design" ->> 'backgroundColor' = '#ffffff'
  AND "design" ->> 'textColor' = '#111827'
  AND "design" ->> 'primaryColor' = '#111827';

ALTER TABLE "scene" DROP COLUMN "design";
