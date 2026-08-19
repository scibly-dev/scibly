-- Enable pgvector extension (required for the vector column type)
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateEnum (idempotent)
DO $$ BEGIN CREATE TYPE "chat_role" AS ENUM ('USER', 'ASSISTANT'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "notebook_source_type" AS ENUM ('PDF', 'DOCX', 'TEXT'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "notebook_source_status" AS ENUM ('PENDING', 'PROCESSING', 'READY', 'FAILED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "integration_provider" AS ENUM ('NOTION', 'CONFLUENCE', 'SHAREPOINT'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- CreateTable: integration_connection (missing from original migration)
CREATE TABLE IF NOT EXISTS "integration_connection" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "provider" "integration_provider" NOT NULL,
    "accessTokenEncrypted" TEXT NOT NULL,
    "refreshTokenEncrypted" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "workspaceId" TEXT,
    "workspaceName" TEXT,
    "connectedByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "integration_connection_pkey" PRIMARY KEY ("id")
);

-- CreateTable: notebook (missing from original migration)
CREATE TABLE IF NOT EXISTS "notebook" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT,
    "promptTemplateId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notebook_pkey" PRIMARY KEY ("id")
);

-- CreateTable: notebook_source (missing from original migration)
CREATE TABLE IF NOT EXISTS "notebook_source" (
    "id" TEXT NOT NULL,
    "notebookId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "notebook_source_type" NOT NULL,
    "url" TEXT,
    "content" TEXT,
    "status" "notebook_source_status" NOT NULL DEFAULT 'PENDING',
    "error" TEXT,
    "fileSize" INTEGER,
    "pageCount" INTEGER,
    "externalId" TEXT,
    "externalUrl" TEXT,
    "integrationId" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notebook_source_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "notebook_source_chunk" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "chunkIndex" INTEGER NOT NULL,
    "embedding" vector(1536) NOT NULL,

    CONSTRAINT "notebook_source_chunk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "notebook_chat" (
    "id" TEXT NOT NULL,
    "notebookId" TEXT NOT NULL,
    "role" "chat_role" NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notebook_chat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "course_source_snapshot" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "contentHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "course_source_snapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "prompt_template" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "systemPrompt" TEXT NOT NULL,
    "organizationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prompt_template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "organization_ai_model" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "baseUrl" TEXT NOT NULL,
    "apiKeyEncrypted" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_ai_model_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "oauthClient" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "clientSecret" TEXT,
    "disabled" BOOLEAN DEFAULT false,
    "skipConsent" BOOLEAN,
    "enableEndSession" BOOLEAN,
    "subjectType" TEXT,
    "scopes" TEXT[],
    "userId" TEXT,
    "createdAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),
    "name" TEXT,
    "uri" TEXT,
    "icon" TEXT,
    "contacts" TEXT[],
    "tos" TEXT,
    "policy" TEXT,
    "softwareId" TEXT,
    "softwareVersion" TEXT,
    "softwareStatement" TEXT,
    "redirectUris" TEXT[],
    "postLogoutRedirectUris" TEXT[],
    "tokenEndpointAuthMethod" TEXT,
    "grantTypes" TEXT[],
    "responseTypes" TEXT[],
    "public" BOOLEAN,
    "type" TEXT,
    "requirePKCE" BOOLEAN,
    "referenceId" TEXT,
    "metadata" JSONB,

    CONSTRAINT "oauthClient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "oauthRefreshToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "sessionId" TEXT,
    "userId" TEXT NOT NULL,
    "referenceId" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3),
    "revoked" TIMESTAMP(3),
    "authTime" TIMESTAMP(3),
    "scopes" TEXT[],

    CONSTRAINT "oauthRefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "oauthAccessToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "sessionId" TEXT,
    "userId" TEXT,
    "referenceId" TEXT,
    "refreshId" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3),
    "scopes" TEXT[],

    CONSTRAINT "oauthAccessToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "oauthConsent" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "userId" TEXT,
    "scopes" TEXT[],
    "referenceId" TEXT,
    "createdAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "oauthConsent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "jwks" (
    "id" TEXT NOT NULL,
    "publicKey" TEXT NOT NULL,
    "privateKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "jwks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "scene_analytics" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT,
    "anonymousSessionId" TEXT,
    "lessonId" TEXT NOT NULL,
    "sceneId" TEXT NOT NULL,
    "spEarned" INTEGER NOT NULL DEFAULT 0,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "gradedBlocks" JSONB,
    "attempt" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scene_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "notebook_source_chunk_sourceId_idx" ON "notebook_source_chunk"("sourceId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "notebook_chat_notebookId_idx" ON "notebook_chat"("notebookId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "course_source_snapshot_courseId_idx" ON "course_source_snapshot"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "course_source_snapshot_courseId_sourceId_key" ON "course_source_snapshot"("courseId", "sourceId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "prompt_template_organizationId_idx" ON "prompt_template"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "oauthClient_clientId_key" ON "oauthClient"("clientId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "oauthClient_userId_idx" ON "oauthClient"("userId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "oauthRefreshToken_token_key" ON "oauthRefreshToken"("token");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "oauthRefreshToken_clientId_idx" ON "oauthRefreshToken"("clientId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "oauthRefreshToken_sessionId_idx" ON "oauthRefreshToken"("sessionId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "oauthRefreshToken_userId_idx" ON "oauthRefreshToken"("userId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "oauthAccessToken_token_key" ON "oauthAccessToken"("token");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "oauthAccessToken_clientId_idx" ON "oauthAccessToken"("clientId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "oauthAccessToken_userId_idx" ON "oauthAccessToken"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "oauthAccessToken_sessionId_idx" ON "oauthAccessToken"("sessionId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "oauthAccessToken_refreshId_idx" ON "oauthAccessToken"("refreshId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "oauthConsent_clientId_idx" ON "oauthConsent"("clientId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "oauthConsent_userId_idx" ON "oauthConsent"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "scene_analytics_enrollmentId_idx" ON "scene_analytics"("enrollmentId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "scene_analytics_anonymousSessionId_idx" ON "scene_analytics"("anonymousSessionId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "scene_analytics_sceneId_idx" ON "scene_analytics"("sceneId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "scene_analytics_lessonId_idx" ON "scene_analytics"("lessonId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "scene_analytics_enrollmentId_lessonId_sceneId_attempt_key" ON "scene_analytics"("enrollmentId", "lessonId", "sceneId", "attempt");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "scene_analytics_anonymousSessionId_lessonId_sceneId_attempt_key" ON "scene_analytics"("anonymousSessionId", "lessonId", "sceneId", "attempt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "anonymous_course_session_courseId_idx" ON "anonymous_course_session"("courseId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "anonymous_course_session_courseVersionId_idx" ON "anonymous_course_session"("courseVersionId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "anonymous_course_session_anonymousId_courseVersionId_key" ON "anonymous_course_session"("anonymousId", "courseVersionId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "certificate_enrollmentId_key" ON "certificate"("enrollmentId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "certificate_enrollmentId_idx" ON "certificate"("enrollmentId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "certificate_userId_organizationId_idx" ON "certificate"("userId", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "certificate_userId_courseVersionId_key" ON "certificate"("userId", "courseVersionId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "course_enrollment_courseVersionId_idx" ON "course_enrollment"("courseVersionId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "course_enrollment_userId_courseVersionId_key" ON "course_enrollment"("userId", "courseVersionId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "course_version_courseId_idx" ON "course_version"("courseId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "course_version_publishedById_idx" ON "course_version"("publishedById");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "course_version_courseId_version_key" ON "course_version"("courseId", "version");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "integration_connection_organizationId_idx" ON "integration_connection"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "integration_connection_organizationId_provider_key" ON "integration_connection"("organizationId", "provider");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "lesson_courseVersionId_idx" ON "lesson"("courseVersionId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "lesson_sourceLessonId_idx" ON "lesson"("sourceLessonId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "notebook_organizationId_idx" ON "notebook"("organizationId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "notebook_userId_idx" ON "notebook"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "notebook_courseId_idx" ON "notebook"("courseId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "notebook_promptTemplateId_idx" ON "notebook"("promptTemplateId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "notebook_source_notebookId_idx" ON "notebook_source"("notebookId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "scene_courseVersionId_idx" ON "scene"("courseVersionId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "scene_sourceSceneId_idx" ON "scene"("sourceSceneId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "scene_progress_lessonId_idx" ON "scene_progress"("lessonId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "scene_progress_enrollmentId_lessonId_sceneId_key" ON "scene_progress"("enrollmentId", "lessonId", "sceneId");

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "anonymous_course_session" ADD CONSTRAINT "anonymous_course_session_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "course"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "anonymous_course_session" ADD CONSTRAINT "anonymous_course_session_courseVersionId_fkey" FOREIGN KEY ("courseVersionId") REFERENCES "course_version"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "certificate" ADD CONSTRAINT "certificate_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "course_enrollment"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "certificate" ADD CONSTRAINT "certificate_courseVersionId_fkey" FOREIGN KEY ("courseVersionId") REFERENCES "course_version"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "certificate" ADD CONSTRAINT "certificate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "certificate" ADD CONSTRAINT "certificate_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "course_enrollment" ADD CONSTRAINT "course_enrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "course_enrollment" ADD CONSTRAINT "course_enrollment_courseVersionId_fkey" FOREIGN KEY ("courseVersionId") REFERENCES "course_version"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "course_version" ADD CONSTRAINT "course_version_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "course"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "course_version" ADD CONSTRAINT "course_version_publishedById_fkey" FOREIGN KEY ("publishedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "integration_connection" ADD CONSTRAINT "integration_connection_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "integration_connection" ADD CONSTRAINT "integration_connection_connectedByUserId_fkey" FOREIGN KEY ("connectedByUserId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "lesson" ADD CONSTRAINT "lesson_courseVersionId_fkey" FOREIGN KEY ("courseVersionId") REFERENCES "course_version"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "lesson" ADD CONSTRAINT "lesson_sourceLessonId_fkey" FOREIGN KEY ("sourceLessonId") REFERENCES "lesson"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "notebook" ADD CONSTRAINT "notebook_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "notebook" ADD CONSTRAINT "notebook_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "notebook" ADD CONSTRAINT "notebook_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "course"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "notebook" ADD CONSTRAINT "notebook_promptTemplateId_fkey" FOREIGN KEY ("promptTemplateId") REFERENCES "prompt_template"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "notebook_source" ADD CONSTRAINT "notebook_source_notebookId_fkey" FOREIGN KEY ("notebookId") REFERENCES "notebook"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "notebook_source_chunk" ADD CONSTRAINT "notebook_source_chunk_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "notebook_source"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "notebook_chat" ADD CONSTRAINT "notebook_chat_notebookId_fkey" FOREIGN KEY ("notebookId") REFERENCES "notebook"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "course_source_snapshot" ADD CONSTRAINT "course_source_snapshot_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "course"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "course_source_snapshot" ADD CONSTRAINT "course_source_snapshot_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "notebook_source"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "prompt_template" ADD CONSTRAINT "prompt_template_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "organization_ai_model" ADD CONSTRAINT "organization_ai_model_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "oauthClient" ADD CONSTRAINT "oauthClient_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "oauthRefreshToken" ADD CONSTRAINT "oauthRefreshToken_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "oauthClient"("clientId") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "oauthRefreshToken" ADD CONSTRAINT "oauthRefreshToken_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "session"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "oauthRefreshToken" ADD CONSTRAINT "oauthRefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "oauthAccessToken" ADD CONSTRAINT "oauthAccessToken_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "oauthClient"("clientId") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "oauthAccessToken" ADD CONSTRAINT "oauthAccessToken_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "session"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "oauthAccessToken" ADD CONSTRAINT "oauthAccessToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "oauthAccessToken" ADD CONSTRAINT "oauthAccessToken_refreshId_fkey" FOREIGN KEY ("refreshId") REFERENCES "oauthRefreshToken"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "oauthConsent" ADD CONSTRAINT "oauthConsent_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "oauthClient"("clientId") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "oauthConsent" ADD CONSTRAINT "oauthConsent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "scene" ADD CONSTRAINT "scene_courseVersionId_fkey" FOREIGN KEY ("courseVersionId") REFERENCES "course_version"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "scene" ADD CONSTRAINT "scene_sourceSceneId_fkey" FOREIGN KEY ("sourceSceneId") REFERENCES "scene"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "scene_analytics" ADD CONSTRAINT "scene_analytics_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "course_enrollment"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "scene_analytics" ADD CONSTRAINT "scene_analytics_anonymousSessionId_fkey" FOREIGN KEY ("anonymousSessionId") REFERENCES "anonymous_course_session"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "scene_analytics" ADD CONSTRAINT "scene_analytics_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "scene_analytics" ADD CONSTRAINT "scene_analytics_sceneId_fkey" FOREIGN KEY ("sceneId") REFERENCES "scene"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "scene_progress" ADD CONSTRAINT "scene_progress_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
