# Integration tests

Five test files prove behaviour no mocked Prisma client can witness — `ts_headline`
fragments and `substring` paging in Postgres, row locking, guarded updates,
concurrent callers racing for the same rate-limit slot, and an external agent's
MCP tool call reaching real tables through the real procedures:

| File                                                                               | Variable                            |
| ---------------------------------------------------------------------------------- | ----------------------------------- |
| `apps/app/src/features/notebook/sources/server/search-sources.integration.test.ts` | `SOURCES_INT_TEST_DATABASE_URL`     |
| `apps/app/src/app/api/chat/generation-debit.integration.test.ts`                   | `ENTITLEMENT_INT_TEST_DATABASE_URL` |
| `apps/app/src/features/organizations/server/plan-upgrade.integration.test.ts`      | `ENTITLEMENT_INT_TEST_DATABASE_URL` |
| `packages/api/src/rate-limit.integration.test.ts`                                  | `RATE_LIMIT_INT_TEST_DATABASE_URL`  |
| `apps/app/src/features/mcp/server/create-course.integration.test.ts`               | `MCP_INT_TEST_DATABASE_URL`         |

The rate-limit one lives in `packages/api`, so vitest resolves its config from
there, not from `apps/app`. It is the only file whose subject is a race: `reserveSlot` claims
that the *database* decides who gets the last slot, and a fake that runs one
statement at a time is exactly the interleaving that never disagrees.

They are opt-in: with the variable unset the `describe` block is skipped, which is
why `pnpm test` stays green on a machine with no database. Each file writes rows
under a prefix unique to the run and deletes them again, but treat the database as
disposable regardless — a failed run can leave rows behind.

**The database must be one you can drop.** Never point these at a shared or hosted
database, staging included: they create organizations, users and notebooks, and
`vitest.setup.ts` pins every other test to a fake `DATABASE_URL` precisely so no
test can reach real data.

## Running them

```bash
pnpm test:int
```

That applies the migrations and runs all five files, in both packages. It defaults
to `postgres://$(whoami)@localhost:5433/scibly_int` and refuses any `INT_DB` that
is not on localhost, so a stray copy-paste cannot aim it at the hosted database.

## The scratch database, once

Port 5433 rather than 5432 deliberately: a machine that has done Postgres work
before usually has something on 5432 already, and a cluster you started for this
is one you can drop without thinking about what else is in it.

```bash
# Homebrew, on a port of its own. Any local Postgres works — this is just the one
# most machines here already have.
PGBIN=/opt/homebrew/opt/postgresql@18/bin
$PGBIN/pg_ctl -D /opt/homebrew/var/postgresql@18 -o "-p 5433" -l /tmp/pg5433.log start
$PGBIN/createdb -p 5433 scibly_int
```

Drop it with `dropdb -p 5433 scibly_int`; stop the cluster with `pg_ctl -D … stop`.
Re-running `pnpm test:int` against an existing database is a no-op once the
migrations are applied.

If Homebrew's service is stuck in `error` state, it is almost always losing the
race for 5432 against another install — check `ps aux | grep postgres` before
assuming the cluster is broken. Starting it on 5433 as above sidesteps that
entirely, and leaves whatever owns 5432 alone.

On macOS the socket path under a deep temp directory can exceed the 103-byte
limit, so a cluster started from one needs `-o "-c unix_socket_directories=''"`
to come up TCP-only.
