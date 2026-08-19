-- L-4: DOCX was never wired up to an extractor/parser/upload path — remove
-- the dead enum value. Safe because no code path can ever have created a
-- DOCX-typed row (guarded defensively below in case of manual DB edits).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "notebook_source" WHERE "type" = 'DOCX') THEN
    RAISE EXCEPTION 'Cannot remove DOCX enum value: rows still reference it';
  END IF;
END $$;

ALTER TYPE "notebook_source_type" RENAME TO "notebook_source_type_old";

CREATE TYPE "notebook_source_type" AS ENUM ('PDF', 'TEXT', 'NOTION_PAGE', 'CONFLUENCE_PAGE', 'SHAREPOINT_PAGE');

ALTER TABLE "notebook_source"
  ALTER COLUMN "type" TYPE "notebook_source_type"
  USING ("type"::text::"notebook_source_type");

DROP TYPE "notebook_source_type_old";
