-- Both columns were write-only: set at OAuth callback, read by nothing. No
-- provider in the registry issues a refresh token or an expiry, so both were
-- always NULL. A provider that needs them can add them back with the code
-- that reads them.
ALTER TABLE "integration_connection"
  DROP COLUMN "refreshTokenEncrypted",
  DROP COLUMN "tokenExpiresAt";
