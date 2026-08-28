# Background work runs on a self-hosted Inngest

Anything that outlives a request, so scheduled syncs, long generations, and
anything that has to retry, is an Inngest function. A function belongs to the
feature it is about and lives with it; a generic one lives in
`apps/app/src/lib/inngest/`. Either way it is collected in
`apps/app/src/server/inngest.ts` — the composition root, the way
`server/api/root.ts` is tRPC's — and served from one route at `/api/inngest`.
The engine driving them is the `inngest/inngest` container in
`docker-compose.yml`, on its own database on the Postgres already there. Not
Inngest Cloud, not a hosted queue.

This replaced hand-rolled cron chaining, where a route took a lease row, ran one
step, then called itself through `after()` before the platform timeout. Nothing
does that any more: the integration sync was the last one, and with it went the
lease table, the `CRON_SECRET` door, and the `crons` entry in `vercel.json`.

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
- Fan-out is how a run per work item is got: a cron function lists what is due
  and sends one event each, and a per-item function does the work under a
  concurrency cap. The item's id travels in the event, never its credential.
- Development needs `pnpm dev:inngest` running alongside `pnpm dev`.
