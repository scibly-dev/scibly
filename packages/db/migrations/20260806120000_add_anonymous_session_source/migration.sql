-- Records where an anonymous session was opened from. Both columns are
-- nullable with no backfill: a NULL `sessionSource` means the row predates
-- tracking, which is a different fact from "arrived via the share link".
CREATE TYPE "AnonymousSessionSource" AS ENUM ('DIRECT', 'EMBED');

ALTER TABLE "anonymous_course_session"
ADD COLUMN "sessionSource" "AnonymousSessionSource",
ADD COLUMN "embedOrigin" TEXT;
