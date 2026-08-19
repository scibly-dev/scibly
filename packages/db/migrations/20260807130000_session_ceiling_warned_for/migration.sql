-- The public-session ceiling warning fired on exact equality against a live
-- count, so two sessions starting at once could step over the threshold without
-- either landing on it and the warning was lost for the period (PW2).
--
-- This column is the record that makes "at or past the line" safe to trigger on:
-- it holds the period the warning was sent for, so a rolled period re-arms it
-- with no reset write anywhere. NULL means no organization has been warned yet,
-- which is the right starting point for every existing row.
ALTER TABLE "organization_subscription"
  ADD COLUMN "sessionCeilingWarnedFor" TIMESTAMP(3);
