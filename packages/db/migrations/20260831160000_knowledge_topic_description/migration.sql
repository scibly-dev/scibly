-- What a topic is about, for the triage model to judge a pull request against.
-- Defaulted rather than nullable: every read renders it, and an empty string is
-- what "the maintainer wrote nothing" already means everywhere else here.
ALTER TABLE "knowledge_topic" ADD COLUMN "description" TEXT NOT NULL DEFAULT '';
