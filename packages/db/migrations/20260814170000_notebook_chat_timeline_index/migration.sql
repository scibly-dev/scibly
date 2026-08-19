-- Every read of this table walks one notebook's messages in timeline order:
-- the chat path's tail after the compaction cutoff, the transcript's newest
-- page. The notebookId-only index left both to sort the whole conversation.
DROP INDEX IF EXISTS "notebook_chat_notebookId_idx";

CREATE INDEX "notebook_chat_notebookId_createdAt_idx" ON "notebook_chat" ("notebookId", "createdAt" DESC);
