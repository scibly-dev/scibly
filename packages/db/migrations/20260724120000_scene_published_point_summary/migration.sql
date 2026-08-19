ALTER TABLE "scene"
ADD COLUMN "hasQuestions" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "maxSp" INTEGER;

-- Backfill the published summary in one pass. Draft maxSp intentionally remains
-- NULL because draft totals are derived from the current authoring document.
WITH "sceneSummary" AS (
  SELECT
    "scene"."id",
    CASE
      WHEN "scene"."gradingManifest" IS NOT NULL
        AND jsonb_typeof("scene"."gradingManifest") = 'array'
      THEN jsonb_array_length("scene"."gradingManifest") > 0
      ELSE false
    END AS "hasQuestions",
    COALESCE(
      (
        SELECT SUM(
          CASE
            WHEN jsonb_typeof(entry.value) = 'object'
              AND (entry.value ->> 'sp') ~ '^-?[0-9]+$'
            THEN (entry.value ->> 'sp')::integer
            ELSE 0
          END
        )
        FROM jsonb_array_elements(
          CASE
            WHEN "scene"."gradingManifest" IS NOT NULL
              AND jsonb_typeof("scene"."gradingManifest") = 'array'
            THEN "scene"."gradingManifest"
            ELSE '[]'::jsonb
          END
        ) AS entry(value)
      ),
      0
    )::integer AS "questionSp"
  FROM "scene"
)
UPDATE "scene"
SET
  "hasQuestions" = "sceneSummary"."hasQuestions",
  "maxSp" = CASE
    WHEN "scene"."courseVersionId" IS NULL THEN NULL
    ELSE "scene"."sp" + "sceneSummary"."questionSp"
  END
FROM "sceneSummary"
WHERE "scene"."id" = "sceneSummary"."id";
