-- The sync runs on Inngest now: a cron function lists the due connections and
-- fans out one run per connection, and Inngest owns the retries. There is no
-- chain to hold a permit for, so nothing takes a lease any more.
-- DropTable
DROP TABLE IF EXISTS "integration_sync_lease";
