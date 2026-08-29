-- GitHub connects by installing an app on an organization, not by an OAuth
-- grant, so it brings a second credential shape rather than a second set of
-- tokens.
ALTER TYPE "integration_provider" ADD VALUE 'GITHUB';

-- The installation is the credential. The token it stands for lasts an hour
-- and is minted from the app's private key on each use, so there is nothing
-- to encrypt and nothing to store.
ALTER TABLE "integration_connection" ADD COLUMN "installationId" TEXT;

-- ...which leaves an installation-backed connection with no access token at
-- all. Existing rows all have one; the column only stops being required.
ALTER TABLE "integration_connection" ALTER COLUMN "accessTokenEncrypted" DROP NOT NULL;
