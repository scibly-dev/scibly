-- `nextDue` held a copy of `currentPeriodEnd`.
--
-- Both were written from the same `periodEnd` on every subscription sync, and
-- neither had a reader outside the write itself, so the pair could only ever
-- differ by a bug. `currentPeriodEnd` is the one kept: it names the period the
-- row is for, and the renewal date is what the end of a period means.
ALTER TABLE "organization_subscription"
  DROP COLUMN "nextDue";
