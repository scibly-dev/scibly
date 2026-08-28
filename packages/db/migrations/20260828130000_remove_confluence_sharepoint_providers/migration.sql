-- CONFLUENCE and SHAREPOINT were schema-level placeholders from the original
-- integrations migration: no provider implementation, no connect path, and no
-- way to produce a row (the registry builds only NOTION and GITHUB, and
-- getAuthUrl rejects anything else before a row could be written). Remove them.
-- Guarded defensively below in case of manual DB edits.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "integration_connection"
    WHERE "provider" IN ('CONFLUENCE', 'SHAREPOINT')
  ) THEN
    RAISE EXCEPTION 'Cannot remove CONFLUENCE/SHAREPOINT enum values: rows still reference them';
  END IF;
END $$;

ALTER TYPE "integration_provider" RENAME TO "integration_provider_old";

CREATE TYPE "integration_provider" AS ENUM ('NOTION', 'GITHUB');

ALTER TABLE "integration_connection"
  ALTER COLUMN "provider" TYPE "integration_provider"
  USING ("provider"::text::"integration_provider");

DROP TYPE "integration_provider_old";
