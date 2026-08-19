-- Published scenes seeded before the seed script computed the point summary
-- were left with NULL maxSp, which crashes every published-SP reader.
-- Same formula as 20260724120000_scene_published_point_summary.
UPDATE "scene"
SET
  "hasQuestions" = CASE
    WHEN jsonb_typeof("gradingManifest") = 'array'
      THEN jsonb_array_length("gradingManifest") > 0
    ELSE false
  END,
  "maxSp" = "sp" + COALESCE(
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
          WHEN jsonb_typeof("gradingManifest") = 'array'
            THEN "gradingManifest"
          ELSE '[]'::jsonb
        END
      ) AS entry(value)
    ),
    0
  )::integer
WHERE "courseVersionId" IS NOT NULL AND "maxSp" IS NULL;
