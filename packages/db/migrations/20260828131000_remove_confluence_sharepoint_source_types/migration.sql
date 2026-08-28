-- CONFLUENCE_PAGE and SHAREPOINT_PAGE matched the CONFLUENCE/SHAREPOINT
-- provider placeholders removed in the previous migration. Notion is the only
-- provider that offers pages, so nothing could ever have created a row of
-- either type. Guarded defensively below in case of manual DB edits.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "notebook_source"
    WHERE "type" IN ('CONFLUENCE_PAGE', 'SHAREPOINT_PAGE')
  ) THEN
    RAISE EXCEPTION 'Cannot remove CONFLUENCE_PAGE/SHAREPOINT_PAGE enum values: rows still reference them';
  END IF;
END $$;

ALTER TYPE "notebook_source_type" RENAME TO "notebook_source_type_old";

CREATE TYPE "notebook_source_type" AS ENUM ('PDF', 'TEXT', 'NOTION_PAGE');

ALTER TABLE "notebook_source"
  ALTER COLUMN "type" TYPE "notebook_source_type"
  USING ("type"::text::"notebook_source_type");

DROP TYPE "notebook_source_type_old";
