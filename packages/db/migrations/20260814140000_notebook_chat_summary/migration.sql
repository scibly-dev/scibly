-- Long conversations are folded into one summary once the estimated context
-- reaches the model's window. The cutoff id says which stored messages the
-- summary already stands for; the messages themselves are never deleted.
-- AlterTable
ALTER TABLE "notebook"
  ADD COLUMN "chatSummary" TEXT,
  ADD COLUMN "chatSummaryThroughMessageId" TEXT;
