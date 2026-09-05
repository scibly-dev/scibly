#!/usr/bin/env bash
# Runs the integration tests against a disposable local Postgres.
#
# They are opt-in because they need a real database — ts_headline fragments,
# substring paging, row locking, two callers racing for the last slot, and an
# external agent's tool call landing in real tables are what they exist to
# prove, and none of it is visible to a mocked client. Opt-in has a failure mode
# though: nobody opts in, and the files never run. This is the opting-in, in one
# command.
#
# INT_DB never defaults to DATABASE_URL and must not be pointed at it. That one
# is a hosted PlanetScale database; these tests create organizations, users,
# notebooks and courses, and delete them again on a good day.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [ -n "${INT_DB:-}" ]; then
  case "$INT_DB" in
    *localhost*|*127.0.0.1*) ;;
    *) echo "refusing: INT_DB must be a local database, got ${INT_DB%%\?*}" >&2; exit 1 ;;
  esac
else
  command -v docker >/dev/null || {
    echo "no docker: start a local Postgres yourself and pass INT_DB=postgres://…@localhost:5433/scibly_int" >&2
    exit 1
  }
  # pgvector, not plain postgres: an old migration runs CREATE EXTENSION "vector"
  # and replays on every fresh database.
  echo "==> scratch database"
  CONTAINER="$(docker run -d --rm \
    -e POSTGRES_USER=scibly -e POSTGRES_PASSWORD=scibly -e POSTGRES_DB=scibly_int \
    -p 127.0.0.1::5432 pgvector/pgvector:pg16)"
  trap 'docker rm -f "$CONTAINER" >/dev/null 2>&1 || true' EXIT
  MAPPED="$(docker port "$CONTAINER" 5432/tcp)"
  INT_DB="postgres://scibly:scibly@127.0.0.1:${MAPPED##*:}/scibly_int"

  for _ in $(seq 60); do
    docker exec "$CONTAINER" pg_isready -U scibly -d scibly_int >/dev/null 2>&1 && break
    sleep 1
  done
fi

echo "==> schema"
DATABASE_URL="$INT_DB" pnpm --filter @scibly/db run migrate:deploy >/dev/null

# A substring path filter, not a filename: vitest exits non-zero if it matches nothing.
for package in apps/app packages/api; do
  echo "==> $package"
  INT_TEST_DATABASE_URL="$INT_DB" \
    pnpm -C "$ROOT/$package" exec vitest run integration.test.ts
done
