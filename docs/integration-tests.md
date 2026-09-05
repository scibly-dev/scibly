# Integration tests

`*.integration.test.ts` files prove behaviour no mocked Prisma client can witness
— `ts_headline` fragments and `substring` paging in Postgres, row locking,
guarded updates, concurrent callers racing for the same rate-limit slot, and an
external agent's MCP tool call reaching real tables through the real procedures.
They all read one variable, `INT_TEST_DATABASE_URL`, and the runner finds them by
that suffix rather than by a list, so a new one runs by existing.

Most live in `apps/app`; `rate-limit.integration.test.ts` lives in `packages/api`,
so vitest resolves its config from there and the runner covers both packages. It
is the only file whose subject is a race: `reserveSlot` claims that the _database_
decides who gets the last slot, and a fake that runs one statement at a time is
exactly the interleaving that never disagrees.

They are opt-in: with the variable unset the `describe` block is skipped, which is
why `pnpm test` stays green on a machine with no database. Each file writes rows
under a prefix unique to the run and deletes them again; on the default container
that is moot, and against your own `INT_DB` a failed run can leave rows behind.

**The database must be one you can drop.** Never point these at a shared or hosted
database, staging included: they create organizations, users and notebooks, and
`vitest.setup.ts` pins every other test to a fake `DATABASE_URL` precisely so no
test can reach real data.

## Running them

```bash
pnpm test:int
```

That starts a Postgres container of its own, applies the migrations, runs every
integration test in both packages, and deletes the container on the way out —
including when a test fails or the run is interrupted, so nothing survives to be
reused by accident. Nothing to create beforehand; the only requirement is a running Docker.

The image is `pgvector/pgvector:pg16`, the one `docker-compose.yml` uses: an old
migration runs `CREATE EXTENSION "vector"` and replays on every fresh database,
so plain `postgres:16` fails `migrate deploy`. The port is whatever Docker hands
out, bound to `127.0.0.1`, so concurrent runs do not collide.

## Against a database you already have

Set `INT_DB` and the script uses it as-is — no container, and nothing dropped
afterwards, so this one has to be a database you can throw away yourself:

```bash
INT_DB=postgres://$(whoami)@localhost:5433/scibly_int pnpm test:int
```

It refuses any `INT_DB` that is not on localhost, so a stray copy-paste cannot aim
it at the hosted database. Port 5433 rather than 5432 by convention here: a machine
that has done Postgres work before usually has something on 5432 already.

On macOS the socket path under a deep temp directory can exceed the 103-byte
limit, so a cluster started from one needs `-o "-c unix_socket_directories=''"`
to come up TCP-only.
