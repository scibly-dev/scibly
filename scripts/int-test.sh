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

INT_DB="${INT_DB:-postgres://$(whoami)@localhost:5433/scibly_int}"

case "$INT_DB" in
  *localhost*|*127.0.0.1*) ;;
  *) echo "refusing: INT_DB must be a local database, got ${INT_DB%%\?*}" >&2; exit 1 ;;
esac

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "==> schema"
DATABASE_URL="$INT_DB" pnpm --filter @scibly/db run migrate:deploy >/dev/null

echo "==> apps/app"
SOURCES_INT_TEST_DATABASE_URL="$INT_DB" \
ENTITLEMENT_INT_TEST_DATABASE_URL="$INT_DB" \
MCP_INT_TEST_DATABASE_URL="$INT_DB" \
  pnpm -C "$ROOT/apps/app" exec vitest run \
  src/features/notebook/sources/server/search-sources.integration.test.ts \
  src/app/api/chat/generation-debit.integration.test.ts \
  src/features/organizations/server/plan-upgrade.integration.test.ts \
  src/features/mcp/server/create-course.integration.test.ts

echo "==> packages/api"
RATE_LIMIT_INT_TEST_DATABASE_URL="$INT_DB" \
  pnpm -C "$ROOT/packages/api" exec vitest run src/rate-limit.integration.test.ts
