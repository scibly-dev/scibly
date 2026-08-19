-- A purchased top-up is recorded in the credit ledger rather than in a table of
-- its own; this is the action that says a row granted generations instead of
-- spending them. Reads that summarise spend exclude it (topup-packs.spec.md TG6).
ALTER TYPE "credit_action" ADD VALUE 'TOPUP_PURCHASE';
