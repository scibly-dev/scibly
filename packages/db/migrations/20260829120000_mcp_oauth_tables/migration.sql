-- Replaces the OAuth provider tables with the shapes better-auth 1.6.11's
-- oidc-provider plugin actually reads. The dropped tables were created by an
-- earlier schema generation but never registered as a plugin, so no code path
-- ever wrote a row to them: the drop cannot lose data.

-- DropTable
DROP TABLE IF EXISTS "oauthAccessToken" CASCADE;
DROP TABLE IF EXISTS "oauthConsent" CASCADE;
DROP TABLE IF EXISTS "oauthRefreshToken" CASCADE;
DROP TABLE IF EXISTS "oauthClient" CASCADE;

-- CreateTable
CREATE TABLE "oauthApplication" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "metadata" TEXT,
    "clientId" TEXT NOT NULL,
    "clientSecret" TEXT,
    "redirectUrls" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "disabled" BOOLEAN DEFAULT false,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "oauthApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oauthAccessToken" (
    "id" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "accessTokenExpiresAt" TIMESTAMP(3) NOT NULL,
    "refreshTokenExpiresAt" TIMESTAMP(3) NOT NULL,
    "clientId" TEXT NOT NULL,
    "userId" TEXT,
    "scopes" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "oauthAccessToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oauthConsent" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scopes" TEXT NOT NULL,
    "consentGiven" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "oauthConsent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "oauthApplication_clientId_key" ON "oauthApplication"("clientId");

-- CreateIndex
CREATE INDEX "oauthApplication_userId_idx" ON "oauthApplication"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "oauthAccessToken_accessToken_key" ON "oauthAccessToken"("accessToken");

-- CreateIndex
CREATE UNIQUE INDEX "oauthAccessToken_refreshToken_key" ON "oauthAccessToken"("refreshToken");

-- CreateIndex
CREATE INDEX "oauthAccessToken_clientId_idx" ON "oauthAccessToken"("clientId");

-- CreateIndex
CREATE INDEX "oauthAccessToken_userId_idx" ON "oauthAccessToken"("userId");

-- CreateIndex
CREATE INDEX "oauthConsent_clientId_idx" ON "oauthConsent"("clientId");

-- CreateIndex
CREATE INDEX "oauthConsent_userId_idx" ON "oauthConsent"("userId");

-- AddForeignKey
ALTER TABLE "oauthApplication" ADD CONSTRAINT "oauthApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oauthAccessToken" ADD CONSTRAINT "oauthAccessToken_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "oauthApplication"("clientId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oauthAccessToken" ADD CONSTRAINT "oauthAccessToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oauthConsent" ADD CONSTRAINT "oauthConsent_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "oauthApplication"("clientId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oauthConsent" ADD CONSTRAINT "oauthConsent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
