# Background work runs on a self-hosted Inngest

Anything that outlives a request, so scheduled syncs, long generations, and
anything that has to retry, is an Inngest function. Functions live in
`apps/app/src/lib/inngest/`, get listed in `functions/index.ts`, and are served
from one route at `/api/inngest`. The engine driving them is the
`inngest/inngest` container in `docker-compose.yml`, on its own database on the
Postgres already there. Not Inngest Cloud, not a hosted queue.

This replaces hand-rolled cron chaining, where a route takes a lease row, runs
one step, then calls itself through `after()` before the platform timeout.
`apps/app/src/app/api/cron/sync-integrations/route.ts` is the last one. It stays
until integration sync moves over.

## Why

Chaining is a scheduler, a queue, a retry policy, and a run log written by hand,
and only the parts we noticed we needed. A step that dies mid-way leaves a lease
to expire and no record of what happened.

Self-hosted rather than Inngest Cloud because Scibly ships as a container people
run themselves. An engine that phones a vendor means either a second, weaker
code path for on-prem or an Inngest account as a condition of installing. Vercel
Queues and Workflows lose on the same point, since they exist only inside Vercel.

## Consequences

- `INNGEST_BASE_URL`, `INNGEST_EVENT_KEY`, and `INNGEST_SIGNING_KEY` are all
  required with no defaults, and the two keys have to match the ones the server
  started with. A deployment with no server to point at fails to boot rather
  than silently dropping background work. `INNGEST_DEV` switches signing
  explicitly instead of inferring it from whether a URL is set.
- Inngest owns a separate `inngest` database. Backups that dump only `scibly`
  hold no run history.
- The server calls the app over HTTP, so the app is a service the engine reaches
  rather than a worker that dials out. Any topology has to allow that.
- `maxDuration` on `/api/inngest` bounds one step, not a run. A model call that
  might outlast it belongs in `step.ai.infer`, which parks the request on the
  server instead.
- Development needs `pnpm dev:inngest` running alongside `pnpm dev`.
