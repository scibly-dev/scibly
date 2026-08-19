-- The last "student" left in stored data: the answer key inside
-- `scene_analytics.gradedBlocks`. Renaming it here is what lets both readers
-- drop their `learnerAnswer ?? studentAnswer` fallback, rather than carrying
-- one forever for rows written before the rename.
--
-- WITH ORDINALITY because block order is what the review path replays answers
-- in; jsonb_agg over an unordered set is not required to preserve it.
--
-- jsonb_exists() rather than the `?` operator: `?` is a placeholder character
-- to enough drivers that it is not worth finding out which one runs this.
UPDATE "scene_analytics"
SET "gradedBlocks" = (
  SELECT jsonb_agg(
    CASE
      WHEN jsonb_exists(block, 'studentAnswer')
        THEN (block - 'studentAnswer')
             || jsonb_build_object('learnerAnswer', block -> 'studentAnswer')
      ELSE block
    END
    ORDER BY position
  )
  FROM jsonb_array_elements("gradedBlocks") WITH ORDINALITY AS elements(block, position)
)
WHERE jsonb_typeof("gradedBlocks") = 'array'
  AND EXISTS (
    SELECT 1
    FROM jsonb_array_elements("gradedBlocks") AS block
    WHERE jsonb_exists(block, 'studentAnswer')
  );
