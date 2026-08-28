# Refactor Plan: Integrations — GitHub App provider, connect callback, sync chain

Date: 2026-08-28 · Branch: `claude/github-issue-9-2fd543` · Analyzed at commit `8189f39` (merge-base with `main`: `2fa7c44`)

Scope: the branch diff (`git diff $(git merge-base HEAD main)...HEAD`) — 36 files, +1541/−163 — plus
files heavily entangled with it (`base-provider.ts`, `registry.ts`, `contracts.ts`, the notebook
source ingestion extractors). Revision 2 folds in the user's directives of 2026-08-28; every change
from revision 1 is marked **[user-directed]**.

## Baseline

Every step below must return the tree to exactly this state. Both commands were green at `8189f39`.

| Command | Status at baseline |
| --- | --- |
| `pnpm check` (i18n + typecheck + lint — the fast gate) | **exit 0**, 32/32 tasks successful |
| `pnpm --filter @scibly/app run test` | **176 passed / 3 skipped** files · **2642 passed / 6 skipped** tests |

Suppression census for the in-scope tree (`grep -rn "eslint-disable|@ts-ignore|@ts-expect-error"` over
`features/integrations`, `features/notebook/sources`, `features/organizations/settings`): **exactly one**,
at `apps/app/src/features/organizations/settings/components/org-settings-form.tsx:87`. No step may add a
second; Step 13 removes this one.

### Coverage assessment

Server-side logic is well covered and the tests read as specifications (requirement-tagged `describe`
blocks, shared builders):

| File | Test | Lines of test |
| --- | --- | --- |
| `server/sync-source-freshness.ts` | ✅ `sync-source-freshness.test.ts` | 738 |
| `server/connect-callback.ts` | ✅ `connect-callback.test.ts` | 542 |
| `api/integration-connection-procedures.ts` | ✅ `api/integration-connections.test.ts` | 345 |
| `server/providers/github/provider.ts` | ✅ `provider.test.ts` | 284 |
| `server/connection-token.ts` | ✅ `connection-token.test.ts` | 108 |
| `server/providers/notion.ts` | ✅ (covered via provider tests) | — |

Gaps that matter to this plan:

- **`settings/components/org-integrations-card.tsx` (307 lines) has no test**, and Step 10 restructures it
  into eight files. The repo does test components (23 `*.test.tsx` files, e.g.
  `features/organizations/settings/components/org-ai-config-card.test.tsx`), so this is a convention gap,
  not a policy. → **Phase 0**.
- `server/providers/github/app-auth.ts` (160 lines) is only exercised indirectly through mocks in
  `provider.test.ts`. No step below restructures it, so no characterization test is required; its issues
  are listed under Behavior-changing fixes.
- `api/integration-page-procedures.ts` (131 lines) and `page-picker/use-page-picker-controller.ts`
  (193 lines) have no tests. No step below restructures them.

## Constraints

- **Behavior preservation is the prime directive.** Current behavior is the spec, quirks included. Where a
  step would change observable behavior it has been moved out of the step list into
  *Behavior-changing fixes*, which ship separately and only on the user's say-so.
  **Two sanctioned exceptions**, both user-directed and both carrying an explicit *Behavior delta* line:
  **Step 7** (one owed-connections query per hop) and **Step 12** (disconnect confirmation dialog).
- All conventions in `.claude/skills/refactor/references/codebase.md` apply, in particular:
  - one React component per `.tsx` file (skeletons and empty states included); kebab-case filenames;
    PascalCase components; feature context subfolders under `components/`;
  - **no `createElement` and no lowercase JSX-returning helpers** in feature UI;
  - **no lint/type suppressions** — they are fixed properly, never re-silenced or `_`-prefixed;
  - env access through the typed `@/env`; raw `process.env` reads are findings;
  - user-facing strings must be translated;
  - **URLs are built by `@scibly/routes`, never by string concatenation at the call site**
    *(added to `codebase.md` by this run)* **[user-directed]**;
  - **multi-write invariants go through `prisma.$transaction`** *(the rule already existed; this run
    sharpened it — see the audit below)* **[user-directed]**.
- The domain vocabulary in `apps/app/src/features/integrations/CONTEXT.md` is binding, including each
  term's `_Avoid_` list. Steps 6 and 8 exist to bring the sync module back into it.
- Verification for every step: `pnpm check` **and** `pnpm --filter @scibly/app run test` return to the
  baseline above, plus a suppression grep over the touched files showing no new
  `eslint-disable|@ts-ignore|@ts-expect-error`.

### Transaction audit **[user-directed]**

"Always use DB transactions when possible" was applied as a sweep, not a slogan. Every multi-write
sequence in the in-scope tree, and what it needs:

| Site | Writes | State | Where it is handled |
| --- | --- | --- | --- |
| `server/connection-token.ts:50-51` (`forgetRevokedConnection`) | detach sources → delete connection | **not atomic** | BF-6 |
| `server/connect-callback.ts:216` → `:231` | detach sources → upsert connection | **not atomic**, and a provider round-trip sits between the read and the writes | BF-11 |
| `api/integration-connection-procedures.ts:135-142` (`disconnect`) | detach sources → delete connection | **not atomic** | BF-17 |
| `server/sync-source-freshness.ts:266-267` | `markChangedSourcesStale` → `recordPollSuccess` | **not atomic**, but deliberately so — see below | BF-18 |
| `server/detach-sources.ts:12` | one `updateMany` | single write, fine | — |

**Enabling change, shared by BF-6/BF-11/BF-17:** `detachSourcesFromConnection`
(`server/detach-sources.ts:7`) closes over the module-level `db` client, so it cannot participate in a
caller's transaction as written. All three fixes depend on it taking an optional transaction client:

```ts
export async function detachSourcesFromConnection(
  connectionId: string,
  provider: IntegrationProviderId,
  reason: DetachReason,
  client: Prisma.TransactionClient = db,
) { … }
```

That signature change is behavior-preserving on its own (the default keeps every current call site
identical), so it can ship as a preparatory commit ahead of whichever BF goes first.

**Where a transaction is deliberately *not* the answer:** the sync hop. Wrapping
`markChangedSourcesStale` + `recordPollSuccess` in a transaction is correct in principle, but a hop holds
its DB work across provider HTTP calls; a transaction spanning those would hold a connection open for the
length of a network round-trip, which `packages/db`'s serverless pooling is explicitly tuned against. The
right shape there is the narrow one — `$transaction([markChangedSourcesStale, recordPollSuccess])` as a
batch **after** the provider call returns, never around it. BF-18 records this.

## Phase 0 — Safety net

### P0.1: Characterize `OrgIntegrationsCard` before splitting it

- **Files:** create `apps/app/src/features/integrations/settings/components/org-integrations-card.test.tsx`
- **Why:** Step 10 moves eight JSX-returning functions into eight files. Nothing currently proves the card
  still renders the same thing afterwards.
- **Pin down current behavior, quirks included:**
  1. A provider with no connection renders the connect affordance; a connected one renders
     `ProviderStatus` with the workspace name.
  2. `renderProviderIcon` picks `NotionIcon` for `NOTION` and `GitHubIcon` for `GITHUB`.
  3. With `allProviders.length === 0` the card renders the **hardcoded English** string
     `No integrations available.` (`org-integrations-card.tsx:301`). Pin the current string — Step 13
     changes it deliberately, and this test is what proves nothing else did.
  4. **Quirk, pin it as-is:** after a *failed* disconnect the row's button stays `disabled`, because
     `disconnectingId` is cleared only in `onSuccess` (`:255`) and not in `onError` (`:258`). This is
     listed as a behavior fix (BF-13) — the characterization test locks in today's behavior so the
     refactor cannot silently change it, and BF-13 updates the test when it ships.
  5. `ProviderGrants` renders the grant list from `api.integration.listGrants` and fires its
     revoked-toast effect when `wasRevoked` flips. **Pin that today every grant is rendered**, so
     BF-9's first-4-plus-modal change is visible as a deliberate edit to this test rather than a silent
     drift.
- **Follow** `org-ai-config-card.test.tsx` for the local render-test idiom (tRPC mocking, `t` fixture).
- **Verify:** `pnpm --filter @scibly/app run test` — new file passes, total count rises, nothing else moves.

## Refactor steps (ordered)

Each step is independently shippable: after it lands, the fast gate passes and behavior is unchanged. No
step depends on a later one. Ordered safest-first, respecting dependencies. Steps 7 and 12 are the two
user-directed exceptions to behavior preservation and say so in a **Behavior delta** line.

### Step 1: Remove `CONFLUENCE` and `SHAREPOINT` from the `IntegrationProvider` enum **[user-directed]**

- **Files:** `packages/db/schema/integration.prisma`, new migration under `packages/db/migrations/`,
  `apps/app/src/features/notebook/chat/provider-display.tsx`,
  `apps/app/src/features/integrations/server/connect-callback.test.ts`
- **Now:** `packages/db/schema/integration.prisma:1-8` carries four providers:
  ```prisma
  enum IntegrationProvider {
    NOTION
    GITHUB
    CONFLUENCE
    SHAREPOINT

    @@map("integration_provider")
  }
  ```
  `CONFLUENCE` and `SHAREPOINT` date from the original integrations migration
  (`20260605233958_add_integrations_and_source_lineage/migration.sql:8`) and have **no provider
  implementation, no connect path, and no way to produce a row**: `server/registry.ts` builds only
  `NOTION` and `GITHUB`, and `contracts.ts:3` lists only those two, so `getAuthUrl` rejects anything else
  before a row could be written. They are schema-level placeholders for work that was never done.
- **Target:** a two-member enum, following the **existing precedent in this repo** for removing an enum
  value — `packages/db/migrations/20260706170000_remove_docx_source_type/migration.sql`, which guards,
  renames, recreates, re-types, and drops:
  ```sql
  DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM "integration_connection" WHERE "provider" IN ('CONFLUENCE','SHAREPOINT')) THEN
      RAISE EXCEPTION 'Cannot remove CONFLUENCE/SHAREPOINT: rows still reference them';
    END IF;
  END $$;

  ALTER TYPE "integration_provider" RENAME TO "integration_provider_old";
  CREATE TYPE "integration_provider" AS ENUM ('NOTION', 'GITHUB');
  ALTER TABLE "integration_connection" ALTER COLUMN "provider" TYPE "integration_provider"
    USING ("provider"::text::"integration_provider");
  DROP TYPE "integration_provider_old";
  ```
  The guard is the point: it turns "someone somehow has a CONFLUENCE row" from silent data loss into a
  failed migration. Confirm the column list against the schema before writing it — `provider` appears on
  `integration_connection`; grep the generated client for any other column typed `IntegrationProvider`.

  Two consumers must be fixed in the same commit or the gate goes red:
  - `notebook/chat/provider-display.tsx:41-46` has a `"CONFLUENCE"` entry (with its own
    `confluenceLogo` component at `:8`). Delete the entry and the component. `PROVIDER_DISPLAY` is a
    `Map<string, …>` so this is not a compile error — it is a **grep-found** change, which is exactly
    the drift Step 14 removes structurally.
  - `server/connect-callback.test.ts:220-228` uses `SHAREPOINT` as its fixture for "a provider the
    registry cannot build":
    ```ts
    it("LP2 refuses a state naming a provider the registry cannot build", async () => {
      const response = await callback(
        { code: "auth-code", state: state({ provider: "SHAREPOINT" }) },
        "sharepoint",
      );
      expect(refusal(response)).toBe("invalid_state");
    ```
    **Keep the test, change the fixture.** The requirement it pins (LP2) is real and stays real; after
    this step `"SHAREPOINT"` is simply a string outside the enum rather than one inside it, which is the
    more realistic forged-state input anyway. Use a clearly-not-a-provider literal such as
    `"NOT_A_PROVIDER"` and leave the assertion untouched. Do **not** delete the case. `:204`'s
    `"confluence"` is a *path segment*, not an enum value — it exercises LA8 (path/state mismatch) and
    stays valid; leave it, or swap it for another non-matching segment if it reads oddly.
- **Risk:** medium — this is the only step that touches the database. The enum-swap SQL is copied from a
  migration that already shipped, so the shape is proven; the risks are (a) missing a column that uses the
  type, which the `ALTER TABLE` list must cover, and (b) `prisma generate` needing to run before the
  typecheck sees the new enum. Run the migration against a scratch database first and confirm the guard
  fires when a `CONFLUENCE` row is planted.
- **Verify:** `pnpm check`; `pnpm --filter @scibly/app run test`; then
  `grep -rn "CONFLUENCE\|SHAREPOINT" apps/app/src packages/db/schema/integration.prisma` returns nothing
  outside `packages/db/migrations/` (history is immutable) and `apps/web` (marketing copy about the
  Confluence *product*, unrelated).

### Step 2: Derive `IntegrationProviderId` from the Prisma enum **[revised by Step 1]**

- **Files:** `apps/app/src/features/integrations/contracts.ts`,
  `apps/app/src/features/integrations/server/connection-token.ts`
- **Depends on:** Step 1
- **Now:** `contracts.ts:3` hand-writes the provider union:
  ```ts
  export const INTEGRATION_PROVIDERS = ["NOTION", "GITHUB"] as const;
  export type IntegrationProviderId = (typeof INTEGRATION_PROVIDERS)[number];
  ```
  Prisma independently generates the `IntegrationProvider` enum
  (`packages/db/schema/generated/prisma/enums.ts:75-82`), re-exported through `packages/db/src/enums.ts`.
  The two drift by hand. That drift is why `connection-token.ts:20` types the field as
  `provider: IntegrationProviderId | string` — a union TypeScript immediately collapses to `string`, so
  the narrow half documents an intent the compiler never enforces.
- **Target:** with Step 1 landed, the two lists are the *same* list, so the literal array stops being a
  deliberate subset and becomes pure duplication. Keep the runtime array (`z.enum(INTEGRATION_PROVIDERS)`
  at `api/integration.schema.ts:11` needs a value, and `satisfies Record<IntegrationProviderId, …>`
  exhaustiveness checks need the union), but tie it to the enum so a future schema change is a compile
  error:
  ```ts
  import type { IntegrationProvider } from "@scibly/db/enums";

  /**
   * Every provider the schema knows and the registry can build — since the
   * CONFLUENCE/SHAREPOINT placeholders were dropped these are the same set.
   * The `satisfies` makes a schema change that this list has not followed a
   * compile error rather than a runtime surprise.
   */
  export const INTEGRATION_PROVIDERS = [
    "NOTION",
    "GITHUB",
  ] as const satisfies readonly IntegrationProvider[];
  ```
  A `satisfies` catches an *added* member being misspelled but not an added member being ignored. If the
  team wants full bidirectional enforcement, add the one-line exhaustiveness assertion beside it:
  ```ts
  type _AllProvidersListed = IntegrationProvider extends (typeof INTEGRATION_PROVIDERS)[number]
    ? true
    : never;
  ```
  Prefer the assertion — with the enum now equal to the implemented set, "add a provider to the schema and
  forget the app" is the exact failure worth catching. Then narrow `ConnectionCredential.provider` to
  `IntegrationProviderId` and let `getProvider` (`server/registry.ts:22`, which already narrows through
  `isIntegrationProvider`) be the single place a raw DB string is widened.
- **Risk:** low. If narrowing `ConnectionCredential.provider` surfaces a call site that really does pass a
  raw DB string, route it through `isIntegrationProvider` rather than re-widening the type.
  `contracts.ts` must stay dependency-free of provider SDKs — `@scibly/db/enums` is a type-only import
  of a generated file and does not pull Prisma into the client bundle. Confirm with a `type` import.
- **Verify:** `pnpm check`; `pnpm --filter @scibly/app run test`.

### Step 3: Remove `CONFLUENCE_PAGE` and `SHAREPOINT_PAGE` from `NotebookSourceType` **[user-directed]**

- **Files:** `packages/db/schema/notebook.prisma`, new migration under `packages/db/migrations/`,
  `apps/app/src/shared/content/sources/constants.ts`,
  `apps/app/src/features/notebook/workspace/utils/constants.ts`,
  `packages/course-content/src/types.ts`
- **Depends on:** nothing (independent of Steps 1–2), but ship it after Step 1 so the two enum migrations
  are reviewed one at a time
- **Now:** the same two dead providers have matching source types
  (`packages/db/schema/notebook.prisma:5-6`), reachable from four places, none of which can ever produce
  one — the only page provider is Notion:
  - `shared/content/sources/constants.ts:22-23` — `SOURCE_TYPES.CONFLUENCE_PAGE` / `SHAREPOINT_PAGE`
  - `shared/content/sources/constants.ts:51-52` — `MAX_FILE_SIZE` entries, both `0`, present only
    because the object is `satisfies Record<SourceType, number>`
  - `notebook/workspace/utils/constants.ts:143-157` — `SOURCE_DISPLAY_MAP` entries keyed
    `"confluence_page"` / `"sharepoint_page"`
  - `packages/course-content/src/types.ts:32-33` — two members of a hand-written string union
- **Target:** drop both members from the Prisma enum with the same guarded migration shape as Step 1
  (guarding `SELECT 1 FROM "notebook_source" WHERE "type" IN ('CONFLUENCE_PAGE','SHAREPOINT_PAGE')`), then
  delete the four consumers. `MAX_FILE_SIZE` and `SOURCE_TYPES` shrink together — the `satisfies` keeps
  them honest, so removing one without the other is a compile error, which is the desired behavior.
- **Risk:** **wider blast radius than Step 1 and the one place to be careful.** `SourceType` is a
  cross-package type: `packages/course-content` re-declares it by hand rather than importing it, so the
  compiler will *not* connect the two — that file must be edited by grep, not by following errors. Check
  `packages/course-content` consumers for a `switch` over source type that would now be missing a case
  (an exhaustive switch getting *fewer* cases is safe; a `default` that relied on them is not).
  `SOURCE_DISPLAY_MAP` is `Map<string, …>` with a `DEFAULT_SOURCE_DISPLAY` fallback
  (`workspace/utils/constants.ts:161-168`), so its entries are dead weight rather than a type error —
  again grep, not compile.
  **Guard clause:** if production has any `notebook_source` row with either type, the migration must fail
  rather than coerce. Run the guard query against a production snapshot before writing the migration; if
  rows exist, stop and bring the finding back rather than shipping the step.
- **Verify:** `pnpm check`; `pnpm --filter @scibly/app run test`; then
  `grep -rn "CONFLUENCE_PAGE\|SHAREPOINT_PAGE\|confluence_page\|sharepoint_page" apps packages ee`
  returns nothing outside `packages/db/migrations/`.

### Step 4: Let `@scibly/routes` own the integration callback URL **[user-directed]**

- **Files:** `packages/routes/src/index.ts`,
  `apps/app/src/features/integrations/api/integration-connection-procedures.ts`,
  `apps/app/src/features/integrations/server/connect-callback.ts`
- **Now:** the same URL is built twice, by hand, from two different env sources:
  ```ts
  // api/integration-connection-procedures.ts:112 — RAW process.env
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/${input.provider.toLowerCase()}/callback`;

  // server/connect-callback.ts:194 — typed env
  const redirectUri = `${env.NEXT_PUBLIC_APP_URL}/api/integrations/${callback.provider.toLowerCase()}/callback`;
  ```
  Notion requires the token-exchange `redirect_uri` to match the authorize-time one byte for byte, so a
  divergence breaks connect with only `token_exchange_failed` to show for it. The raw `process.env` read
  also violates codebase.md's typed-env rule, and an unset value yields the literal string `undefined`.
- **Target:** the routes package already owns every other app URL, including the sibling cron route that
  this very feature calls (`packages/routes/src/index.ts:193-198`):
  ```ts
  api: {
    cron: {
      syncIntegrations: toAppUrl(`${BASE_API_PATH}/cron/sync-integrations`),
    },
    oembed: toAppUrl(`${BASE_API_PATH}/oembed`),
  },
  ```
  Add the callback beside them:
  ```ts
  api: {
    cron: { … },
    oembed: toAppUrl(`${BASE_API_PATH}/oembed`),
    integrations: {
      callback: (provider: string) =>
        toAppUrl(`${BASE_API_PATH}/integrations/${provider.toLowerCase()}/callback`),
    },
  },
  ```
  Both call sites become `routes.app.api.integrations.callback(input.provider)`. This also deletes the raw
  `process.env` read outright rather than converting it: `packages/routes/src/env.ts` already loads
  `NEXT_PUBLIC_APP_URL` through `loadPackageEnv`, so the typed-env rule is satisfied by construction.

  Type the parameter as `string`, not `IntegrationProviderId` — `packages/routes` must not depend on an
  app-level type, and the argument is lowercased into a path segment either way. **Sweep in the same
  commit:** `grep -rn 'NEXT_PUBLIC_APP_URL\|NEXT_PUBLIC_WEB_URL' apps/app/src apps/web/src` for other
  hand-built URLs that belong in the routes package; fold in any that are a one-line move and list the
  rest here rather than growing this step.
- **Risk:** low, but this is the string an external provider validates. Confirm the produced value is
  byte-identical to today's for both `NOTION` and `GITHUB` — same lowercasing, no trailing slash, and note
  `toAppUrl` uses `String.concat` with a leading-slash guard, so `BASE_API_PATH` already starting with `/`
  is correct and does not double up.
- **Verify:** `pnpm check`; `pnpm --filter @scibly/app run test` — `connect-callback.test.ts` and
  `integration-connections.test.ts` both exercise these paths. Then
  `grep -rn 'api/integrations/' apps/app/src --include='*.ts' --include='*.tsx'` shows the literal path
  only inside `packages/routes` and the App Router folder name itself.

### Step 5: Deduplicate `orgSlugInput` **[user-directed]**

- **Files:** `packages/schemas/src/schema/organization/index.ts`,
  `apps/app/src/features/organizations/settings/api/org-ai-config.schemas.ts`,
  `apps/app/src/features/integrations/api/integration.schema.ts`, plus the importers listed below
- **Now:** the identical schema is declared twice, in two features:
  ```ts
  // features/organizations/settings/api/org-ai-config.schemas.ts:9
  export const orgSlugInput = z.object({ orgSlug: z.string() });

  // features/integrations/api/integration.schema.ts:8
  export const orgSlugInput = z.object({ orgSlug: z.string() });
  ```
  The first is consumed by `org-ai-query-procedures.ts:24,59` and by **nine** procedures in
  `billing-procedures.ts` (`:34,69,83,89,95,101,111,121,131`, the last four via `.extend()`); the second
  by `integration-connection-procedures.ts:75`. A third variant is inlined rather than reused —
  `integration.schema.ts:18` and `org-ai-config.schemas.ts:13` both write `orgSlug: z.string()` inside a
  larger object.
- **Target:** one declaration in `packages/schemas/src/schema/organization/index.ts`, which is exactly
  where codebase.md's boundary rule puts it ("Zod schemas belong in `packages/schemas`, not inline next to
  a router"), and which both features already reach as `@scibly/schemas/organization` (the package's
  `exports` map is `"./*": "./src/schema/*/index.ts"`):
  ```ts
  /** The org a procedure acts on, addressed the way the URL addresses it. */
  export const orgSlugInput = z.object({ orgSlug: z.string() });
  ```
  Both feature modules re-export it so their call sites keep importing from their own schema file:
  ```ts
  import { orgSlugInput } from "@scibly/schemas/organization";
  export { orgSlugInput };
  ```
  That keeps `.extend()` working as the local idiom and makes the change a one-line edit per feature
  rather than fourteen import rewrites. Fold the two inlined `orgSlug: z.string()` occurrences into
  `orgSlugInput.extend({ … })` in the same commit — that is what makes this a dedup rather than a move.
- **Risk:** low, with one thing to check: `packages/schemas` imports `from "zod/v4"` while both feature
  files import `from "zod"` (resolved to v4 by the pnpm override). Confirm the two specifiers produce the
  same `ZodObject` at runtime — if `.extend()` on the shared object misbehaves in `billing-procedures.ts`,
  that is the cause, and the fix is to align the import specifier, never to re-declare the schema.
  `packages/schemas` has its own Jest suite (`pnpm --filter @scibly/schemas run test`); run it too.
- **Verify:** `pnpm check`; `pnpm --filter @scibly/app run test`;
  `pnpm --filter @scibly/schemas run test`; then
  `grep -rn 'z.object({ orgSlug: z.string() })' apps packages` returns exactly one hit.

### Step 6: Rename the sync module to the CONTEXT vocabulary

- **Files:** `apps/app/src/features/integrations/server/sync-source-freshness.ts`,
  `apps/app/src/features/integrations/server/sync-source-freshness.test.ts`,
  `apps/app/src/features/integrations/server.ts`,
  `apps/app/src/app/api/cron/sync-integrations/route.ts`,
  `apps/app/src/features/notebook/sources/ingestion/extractors/integration-extractors.ts`
- **Now:** the module names three core concepts with words `CONTEXT.md` explicitly lists under `_Avoid_`,
  and gives one concept two names in the same file:
  - `SYNC_BATCH_SIZE` (`:18`) — Chain `_Avoid_: batch`
  - `syncConnection` (`:235`) — Poll `_Avoid_: sync (the run, not the turn)`; this function *is* a poll
  - `runSyncStep` / `SyncStepResult` (`:275`, `:270`) — "step" is a third name for a Hop, while the same
    file already says hop at `:20` (`SYNC_HOP_DEADLINE_MS`), `:22` (`MAX_SYNC_HOPS`), `:283`
    (`hopStartedAt`), `:315` (`"Hop failed:"`), and the caller wraps it as `startHop`
    (`app/api/cron/sync-integrations/route.ts:21`)
  - `postToSyncRoute` (`:321`) — names the transport where the domain says Chain
  - `loadSyncableSources` (`:162`), `recordAttempt` (`:181`), `recordPollSuccess` (`:191`) all take the
    parameter name `integrationId` while every call site passes `connection.id` — Connection
    `_Avoid_: integration (the context, not the record)`
- **Target:** pure renames, no logic touched:

  | Now | Target |
  | --- | --- |
  | `syncConnection` | `pollConnection` |
  | `runSyncStep` | `runSyncHop` |
  | `SyncStepResult` | `SyncHopResult` |
  | `postToSyncRoute` | `handOffChain` |
  | `SYNC_BATCH_SIZE` | `SYNC_HOP_CONNECTION_LIMIT` |
  | `integrationId` params (3 fns) | `connectionId` |

  The **DB column** `NotebookSource.integrationId` keeps its name (renaming it needs a migration and is
  out of scope), so the Prisma filters become `where: { integrationId: connectionId }` — the mismatch then
  lives in exactly one visible place per query instead of being smeared across the parameter names. Apply
  the same `integrationId` → `connectionId` rename to `resolveIntegration` in
  `integration-extractors.ts:10`.
- **Risk:** very low — no behavior, no exported *shape*. The one thing to get right is the re-export list
  in `server.ts:8-13` and the two call sites in `app/api/cron/sync-integrations/route.ts:7,23`; the
  typechecker catches any miss.
- **Verify:** `pnpm check`; `pnpm --filter @scibly/app run test` — 738 lines of tests must pass unchanged
  apart from the renamed imports. `git diff` should contain no logic hunks.

### Step 7: Collapse the two owed-connections queries into one **[user-directed]**

- **Files:** `apps/app/src/features/integrations/server/sync-source-freshness.ts`,
  `sync-source-freshness.test.ts`
- **Depends on:** Step 6 (names below are post-rename)
- **Now:** `runSyncHop` calls `loadOwedConnections` once at `:277` to get the hop's work, then **again** at
  `:308` purely to decide whether to continue the chain:
  ```ts
  const connections = await loadOwedConnections(lease, new Date());   // :277
  for (const connection of connections) { … }                         // serial loop
  const remaining = await loadOwedConnections(lease, new Date());      // :308
  const continued = remaining.length > 0 && hops < MAX_SYNC_HOPS;
  ```
  The second query does the same `findMany` — same filters, same ordering, same `take` — and its result is
  used only as a boolean. Two round trips per hop where one would do.
- **Target:** ask for one row more than the hop can use, and let the surplus answer the question:
  ```ts
  const owed = await loadOwedConnections(lease, now, SYNC_HOP_CONNECTION_LIMIT + 1);
  const connections = owed.slice(0, SYNC_HOP_CONNECTION_LIMIT);
  const moreOwed = owed.length > SYNC_HOP_CONNECTION_LIMIT;
  ```
  This is sound because of how the query already excludes work in flight
  (`sync-source-freshness.ts:135-140`):
  ```ts
  OR: [{ lastAttemptedAt: null }, { lastAttemptedAt: { lt: lease.chainStartedAt } }],
  ```
  Every connection this hop touches gets `lastAttemptedAt = now` (`recordAttempt`), which is `>=
  chainStartedAt`, so it is *already* excluded from any later query in the same chain. The second query's
  only job was to re-derive "is there anything left", and the `+1` row derives it without a round trip.
  Note the deadline path already sets `deadlineReached = true` and short-circuits, so this only applies
  when the loop drained a full batch.
- **Behavior delta — read this before shipping.** This is **not** perfectly behavior-preserving, and the
  difference is worth stating precisely rather than hiding:
  - **Today:** the continue decision is made *after* the hop's ~4 minutes of work, so a connection whose
    `nextPollAfter` elapsed *during* the hop is seen and the chain continues for it.
  - **After:** the decision is made *before* the work, so that connection is missed and waits for the next
    chain — which, on the daily cron (`apps/app/vercel.json` → `"0 4 * * *"`), means the next day.
  - **How narrow:** `SYNC_BACKOFF_MS` is `[0, 0, 0, 6h, 1d, 3d]`, and `recordPollFailure` writes
    `nextPollAfter: delay > 0 ? … : null`. So only a connection with **≥4 consecutive failures** has a
    non-null `nextPollAfter` at all. The window is a ~4-minute crossing on a 6h-or-longer timer, for a
    connection that is already failing, on the last hop of a chain. Everything else — connections with
    `nextPollAfter: null`, and any hop that is not the last — is bit-identical.
  - **Recommendation:** ship it. The delta costs a repeatedly-failing connection one extra day in a rare
    window; the fix removes one DB round trip per hop, every hop, forever. If that trade is unwanted, the
    alternative that preserves behavior exactly is to keep the second query but make it
    `count({ …, take: 1 })` instead of a full `findMany` — cheaper, same semantics, but still a round trip.
- **Risk:** low mechanically. `loadOwedConnections` gains a limit parameter, so give it a default of
  `SYNC_HOP_CONNECTION_LIMIT` and keep the existing tests calling it unchanged. The trap is slicing:
  `connections` must be the sliced array everywhere downstream, or the hop polls `LIMIT + 1` connections
  and the deadline budget is off by one.
- **Verify:** `pnpm check`; `pnpm --filter @scibly/app run test`. The
  `describe("KS1/KS2/KC1/KC4: which connections a hop is accountable for")` block is the one that matters;
  its existing assertions must pass unchanged. **Add** a case asserting `db.integrationConnection.findMany`
  is called **once** per hop — that is the assertion that keeps the second query from creeping back.

### Step 8: Split the sync module into `server/sync/`

- **Files:** delete `apps/app/src/features/integrations/server/sync-source-freshness.ts` (343 lines) and
  `sync-source-freshness.test.ts` (738 lines); create the folder below; update
  `apps/app/src/features/integrations/server.ts:8-13`
- **Depends on:** Steps 6 and 7 (rename and fix first, then move — otherwise the diff mixes all three and
  none of them is reviewable)
- **Now:** one file stacks four concerns that change for different reasons and share no state beyond
  `SyncLease`: the lease (`:60`, `:94`, `:111`), connection selection (`:131`), per-connection polling
  (`:175`, `:203`, `:235`), and the chain handoff (`:275`, `:321`). The test file already groups along
  exactly these seams (`describe("KW1/KW4/KW5: the interval a poll covers")`,
  `describe("KS1/KS2/KC1/KC4: which connections a hop is accountable for")`,
  `describe("KC2/KC3: the singleton lease")`).
- **Target:** three modules plus a barrel, each with its test beside it:

  | New file | Exports |
  | --- | --- |
  | `server/sync/sync-lease.ts` | `acquireSyncLease`, `continueSyncLease`, `releaseSyncLease`, `type SyncLease`; module-private `SYNC_LEASE_MS`, `SYNC_LEASE_ID` |
  | `server/sync/poll-connection.ts` | `pollConnection`, `loadOwedConnections`, `getPollingStart`, `backoffMs`, `type SyncConnection`, `type SyncRunTotals`; module-private `loadSyncableSources`, `markChangedSourcesStale`, `recordAttempt`, `recordPollSuccess`, `recordPollFailure`, `SYNC_WINDOW_FLOOR_MS`, `SYNC_CLOCK_SKEW_MS`, `SYNC_HOP_CONNECTION_LIMIT`, `SYNC_BACKOFF_MS`, `SYNC_BACKOFF_CAP_MS` |
  | `server/sync/run-sync-hop.ts` | `runSyncHop`, `type SyncHopResult`; module-private `handOffChain`, `SYNC_HOP_DEADLINE_MS`, `MAX_SYNC_HOPS` |
  | `server/sync/index.ts` | barrel re-exporting exactly what `server.ts` re-exports today |

  Keep the backoff ladder in `poll-connection.ts` with the bookkeeping that writes it — splitting the
  table from `recordPollFailure` would put one invariant in two modules. Split the test file the same
  three ways, moving each `describe` block beside its new module.
- **Risk:** moderate — it is the largest mechanical change in the plan. The failure mode is an import
  cycle (`run-sync-hop` → `poll-connection` → `sync-lease` must stay a straight line, no back-edges) and a
  missed re-export from `server.ts`. Both are compile errors, not silent breaks. Constants that are
  currently exported but only used inside the module should become module-private; if a test imports one,
  keep it exported rather than loosening the test.
- **Verify:** `pnpm check`; `pnpm --filter @scibly/app run test` — the same assertions must pass, now
  spread over three files with the total test count unchanged. Confirm
  `apps/app/src/features/integrations/server.ts` re-exports the identical surface:
  `git show HEAD~1:apps/app/src/features/integrations/server.ts` vs. the new one.

### Step 9: Collapse the provider class hierarchy (the code-judo move)

- **Files:** `apps/app/src/features/integrations/server/base-provider.ts`,
  `apps/app/src/features/integrations/server/connection-token.ts`,
  `apps/app/src/features/integrations/server/registry.ts`,
  `apps/app/src/features/integrations/server/providers/notion.ts`,
  `apps/app/src/features/integrations/server/providers/github/provider.ts`
- **Now:** two providers are served by a four-way type split — `BaseIntegrationProvider`,
  `PageIntegrationProvider`, an **empty** `ReadOnlyIntegrationProvider` marker class, and a separate
  `AppInstallationProvider` *interface* reached through a `mintsInstallationTokens` type guard. Each
  capability is expressed a different way, and three of the four expressions are dead weight:
  - `refreshToken` (`:57`) — **no production caller anywhere.** The only reference in the repo is the test
    at `providers/github/provider.test.ts:280`. No provider overrides it. The `tokenExpiresAt` column it
    would key off is written (`connect-callback.ts:176,185`) and **read nowhere**;
    `resolveConnectionToken` never checks expiry.
  - `ReadOnlyIntegrationProvider` — an empty subclass carrying no members.
  - `listsGrants` (`:52`) — a boolean flag that only restates whether a subclass overrode `listGrants`.
  - `PageIntegrationProvider`'s four base implementations (`listChildren`, `listDatabasePages`,
    `getPageRevision`, `pollModifiedPages`) return empty/null for a subclass that never uses them — Notion
    overrides all four and is the only page provider.
  - `AppInstallationProvider` + `mintsInstallationTokens` — a single-implementor interface plus a runtime
    type guard, to express "this provider mints tokens instead of storing them".
- **Target:** one abstract class where a capability is an optional method, and *having* the method is the
  capability — deleting the entire "capability as a position in a type hierarchy" category:
  ```ts
  export abstract class IntegrationProvider {
    abstract readonly providerId: IntegrationProviderId;
    abstract readonly displayName: string;
    abstract readonly credential: IntegrationCredentialKind;

    abstract getAuthUrl(state: string, redirectUri: string): string;
    abstract completeConnect(
      params: ConnectCallbackParams,
      redirectUri: string,
    ): Promise<IntegrationCredential>;

    /** Present only on providers connected by letting an app in. */
    mintAccessToken?(installationId: string): Promise<string>;
    /** Present only on providers that hand access out piece by piece. */
    listGrants?(token: string): Promise<IntegrationGrant[]>;
  }

  export abstract class PageIntegrationProvider extends IntegrationProvider {
    abstract searchPages(...): ...;
    abstract fetchPageContent(...): ...;
    abstract listChildren(...): ...;
    abstract listDatabasePages(...): ...;
    abstract getPageRevision(...): ...;
    abstract pollModifiedPages(...): ...;
  }
  ```
  Deletions: `refreshToken`, `ReadOnlyIntegrationProvider`, `listsGrants`, `AppInstallationProvider`,
  `mintsInstallationTokens`. `PageIntegrationProvider` keeps its four methods but as `abstract` — Notion
  already implements every one, so nothing changes at runtime and a future page provider is forced to
  decide rather than silently inheriting "returns nothing".

  Call sites become presence checks:
  ```ts
  // connection-token.ts — was: if (mintsInstallationTokens(provider)) { … }
  if (provider.mintAccessToken) { … }
  // callers of listGrants — was: if (provider.listsGrants) { … }
  const grants = await provider.listGrants?.(token) ?? [];
  ```
  Two consumers of `listsGrants` need updating together: `registry.ts`'s provider descriptor (whatever
  feeds `provider.listsGrants` into the client payload) and
  `settings/components/org-integrations-card.tsx:224`'s render guard
  (`connection && provider.listsGrants ? <ProviderGrants … /> : null`). The client-facing descriptor must
  keep *some* boolean — the browser cannot check for a server method — so keep a `listsGrants` field on
  the **descriptor** while deleting it from the **class**, computed once in `registry.ts` as
  `listsGrants: Boolean(provider.listGrants)`. That is the whole point: one place derives it, instead of
  every provider restating it.

  `PAGE_INTEGRATION_PROVIDERS` in `contracts.ts` stays as it is — it is the client-visible contract and
  must not learn about server classes.

  **Decision recorded:** `refreshToken` is *deleted*, not wired up. Deleting it preserves behavior exactly
  (zero production callers, `tokenExpiresAt` never read); wiring it up would add token-refresh behavior
  that does not exist today, which is a feature, not a refactor. If an expiring-token provider is added
  later, refresh gets designed then, against a real requirement. `tokenExpiresAt` keeps being written —
  dropping the column needs a migration and is out of scope.
- **Risk:** the type guard `mintsInstallationTokens` checks
  `credential === "app_installation" && "mintAccessToken" in provider`; an optional method drops the
  `credential` half of that check. Confirm `connection-token.ts`'s branch order still sends
  OAuth-credential providers down the `accessTokenEncrypted` path — the `credential` discriminant stays on
  the class, so assert on it if the presence check alone reads as weaker. Verify Notion never grows a
  `mintAccessToken`. This is the step most likely to surface a `refreshToken` reference in a test: update
  `providers/github/provider.test.ts:280` by **deleting** that case (it asserts the throw of a method that
  no longer exists), not by keeping the method alive for the test.
- **Verify:** `pnpm check`; `pnpm --filter @scibly/app run test`. Then confirm the deletions are real:
  `grep -rn "refreshToken\|ReadOnlyIntegrationProvider\|mintsInstallationTokens\|AppInstallationProvider" apps/app/src packages`
  should return nothing outside `contracts.ts`'s `OAuthTokens.refreshToken` field (the wire shape Notion's
  OAuth response carries — that stays) and the `refreshTokenEncrypted` DB column;
  `grep -rn "listsGrants" apps/app/src` should show only the descriptor in `registry.ts` and its two
  readers.

### Step 10: Split `org-integrations-card.tsx` into a component folder

- **Files:** delete `apps/app/src/features/integrations/settings/components/org-integrations-card.tsx`
  (307 lines); create `apps/app/src/features/integrations/settings/components/org-integrations/`; update
  the re-export at `apps/app/src/features/integrations/client.ts:3`
- **Depends on:** Phase 0 P0.1
- **Now:** one file defines **eight** JSX-returning functions — `NotionIcon` (`:14`), `GitHubIcon` (`:27`),
  `renderProviderIcon` (`:48`, lowercase and returning JSX), `ProviderStatus` (`:77`), `ProviderAction`
  (`:99`), `ProviderGrants` (`:143`), `ProviderRow` (`:203`), `OrgIntegrationsCard` (`:235`) — plus the
  `PROVIDER_ICONS` registry (`:40`). This PR grew the file by 147 lines. codebase.md: one component per
  file, and files made of several larger components must be split into a folder.
- **Target:** nine files in `org-integrations/`, following the existing feature-subfolder pattern:

  | New file | Export |
  | --- | --- |
  | `org-integrations-card.tsx` | `OrgIntegrationsCard` — container: the `api.integration.list` query, row mapping, empty state |
  | `provider-row.tsx` | `ProviderRow`, `export type ProviderRowProps` (imported by siblings) |
  | `provider-status.tsx` | `ProviderStatus` |
  | `provider-action.tsx` | `ProviderAction` |
  | `provider-grants.tsx` | `ProviderGrants` — owns the `listGrants` query and the revoked-toast effect |
  | `provider-icon.tsx` | `ProviderIcon` + `PROVIDER_ICONS`; **replaces** `renderProviderIcon`, call site becomes `<ProviderIcon providerId={provider.providerId} />` |
  | `notion-icon.tsx` | `NotionIcon` |
  | `github-icon.tsx` | `GitHubIcon` |
  | `use-org-integrations.ts` | `useOrgIntegrations` — the list query, both mutations, `disconnectingId` state |

  The lowercase `renderProviderIcon` becoming a real `ProviderIcon` component is the point of the
  `provider-icon.tsx` file, not an incidental rename — codebase.md forbids lowercase JSX-returning helpers.
- **Risk:** the largest surface-area change in the plan, but every piece is a move. The real risks are
  (a) the `client.ts:3` re-export path, which is what the rest of the app imports, and (b) accidentally
  changing the empty-state string or the disconnect-state quirk while moving them — P0.1 is what catches
  that. Do **not** fix the `isDisconnecting`/`isDisconnectPending` triple-boolean or the stuck-button quirk
  in this step; the first is Step 11's, the second is BF-13.
- **Verify:** `pnpm check`; `pnpm --filter @scibly/app run test` — P0.1 must pass **unmodified**, which is
  the proof the split changed nothing. Then
  `grep -rn "createElement\|eslint-disable\|@ts-ignore\|@ts-expect-error" apps/app/src/features/integrations/settings/components/org-integrations/`
  returns nothing.

### Step 11: Collapse the disconnect state to one derived boolean

- **Files:** `apps/app/src/features/integrations/settings/components/org-integrations/provider-row.tsx`,
  `provider-action.tsx`, `use-org-integrations.ts`
- **Depends on:** Step 10
- **Now:** three overlapping booleans describe one operation — `isDisconnecting` (`:68`),
  `isConnectPending` (`:69`), `isDisconnectPending` (`:70`) — and two of them are consumed as a single
  condition anyway: `disabled={isDisconnecting || isDisconnectPending}` (`:116`).
- **Target:** one `isBusy` derived inside `useOrgIntegrations` as
  `disconnectingId === providerId && disconnectMutation.isPending`, passed down as a single prop.
  `isConnectPending` stays — it is a genuinely different operation.
- **Risk:** low, but note that `isDisconnecting || isDisconnectPending` and
  `isDisconnecting && isDisconnectPending` are **not** the same condition. Today the button is disabled if
  *either* is true; the `&&` form is strictly narrower and would re-enable the button in the window where
  `disconnectingId` is set but the mutation has not started. Keep the `||` semantics unless BF-13 ships
  first, in which case the two collapse to the same thing. If in doubt, ship BF-13 before this step.
- **Verify:** `pnpm check`; `pnpm --filter @scibly/app run test` — P0.1's quirk assertion (item 4) must
  still pass.

### Step 12: Add the disconnect confirmation dialog **[user-directed]**

- **Files:** create
  `apps/app/src/features/integrations/settings/components/org-integrations/disconnect-integration-dialog.tsx`;
  edit `provider-action.tsx`, `provider-row.tsx`, `org-integrations-card.tsx`, `use-org-integrations.ts`
- **Depends on:** Steps 10 and 11
- **Now:** clicking Disconnect fires the mutation immediately
  (`org-integrations-card.tsx:114`, `onClick={onDisconnect}`). Meanwhile two translated keys have existed
  since the feature landed and are read by nothing:
  ```json
  "confirmDisconnectTitle": "Disconnect integration?",
  "confirmDisconnectDescription": "Existing sources will remain in your notebooks, but re-sync will no longer work until you reconnect."
  ```
  (`orgSettings.i18n.en.json:123-124`, mirrored in `.de.json`, typed at `org-settings.types.ts:123-124`.)
  Revision 1 of this plan proposed deleting them as dead copy; the user's direction is to build the dialog
  instead, so they become live keys and Step 13 no longer touches them.
- **Target:** reuse the repo's existing confirmation idiom rather than inventing one. The model is
  `apps/app/src/features/organizations/members/components/modals/remove-member-dialog.tsx`, which composes
  `AlertDialog` from `apps/app/src/shared/ui/components/alert-dialog.tsx` and is driven by a nullable id:
  ```tsx
  export function DisconnectIntegrationDialog({
    provider,          // IntegrationProviderId | null — non-null means open
    onConfirm,
    onClose,
    t,
  }: {
    provider: IntegrationProviderId | null;
    onConfirm: () => void;
    onClose: () => void;
    t: OrgSettingsPage["integrations"];
  }) {
    return (
      <AlertDialog open={!!provider} onOpenChange={(open) => !open && onClose()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.confirmDisconnectTitle}</AlertDialogTitle>
            <AlertDialogDescription>{t.confirmDisconnectDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.cancelButton}</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirm} className="…destructive…">
              {t.disconnectButton}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }
  ```
  `useOrgIntegrations` grows one piece of state — `pendingDisconnect: IntegrationProviderId | null` — and
  `ProviderAction`'s `onDisconnect` sets it instead of calling the mutation. The mutation moves behind
  `onConfirm`. The dialog is rendered **once** by `OrgIntegrationsCard`, not per row, so there is one
  instance regardless of provider count.

  **Two things to get right, both of which the model file gets wrong or does not cover:**
  1. `remove-member-dialog.tsx:62` hardcodes `<AlertDialogCancel>Cancel</AlertDialogCancel>` in English.
     Do **not** copy that. Add a `cancelButton` key to the `integrations` block in both locale files and
     `org-settings.types.ts` — `pnpm check`'s i18n task enforces the pair.
  2. `isBusy` from Step 11 must keep gating the row's button, and the dialog's confirm button needs its
     own pending state, or a double-click confirms twice.
- **Behavior delta:** disconnecting now takes two clicks instead of one. That is the requested change; it
  is called out here rather than buried because P0.1's disconnect assertions must be updated in the same
  commit, and any e2e flow that clicks Disconnect will need the extra step.
- **Risk:** low-moderate. `AlertDialog` is Radix-based and already used in this app, so no new dependency.
  The one real hazard is state leaking between rows: `pendingDisconnect` must be cleared on close *and* on
  success, or the next Disconnect click opens the dialog for the previous provider. Add a render test
  covering open → cancel → open-a-different-provider.
- **Verify:** `pnpm check` (its i18n task gates the new `cancelButton` key in both locales);
  `pnpm --filter @scibly/app run test` — P0.1 updated in the same commit, plus the new dialog test. Then
  `grep -rn "confirmDisconnectTitle\|confirmDisconnectDescription" apps/app/src` shows a **reader**, not
  just the two JSON declarations and the type.

### Step 13: Translate the hardcoded strings and remove the suppression

- **Files:** `apps/app/src/features/organizations/settings/components/org-settings-form.tsx`,
  `apps/app/src/features/organizations/settings/i18n/orgSettings.i18n.en.json`,
  `orgSettings.i18n.de.json`, `org-settings.types.ts`,
  `apps/app/src/features/integrations/settings/components/org-integrations/org-integrations-card.tsx`,
  `apps/app/src/features/notebook/sources/page-picker/use-page-picker-controller.ts`
- **Now:** three clusters of untranslated user-facing copy, and the branch's only lint suppression:
  1. `org-settings-form.tsx:61-74` — ten `IntegrationCallbackError` messages hardcoded in English, plus
     the success toast at `:51` (`` `${integrationConnected.toUpperCase()} connected successfully.` ``)
     and the fallback at `:79`. Meanwhile `org-settings.types.ts:121-126` already declares
     `connectedSuccessfully`, `disconnectedSuccessfully`, `workspaceLabel`, `connectedBy`,
     `confirmDisconnectTitle`, `confirmDisconnectDescription` — translated in both locale files, and all
     but `disconnectedSuccessfully` read by nothing (until Step 12 wires up the last two).
  2. `org-integrations-card.tsx:301` — `No integrations available.` in a component whose every other
     string comes from `t`.
  3. `use-page-picker-controller.ts:163-171` — three toasts with hand-rolled English pluralization
     (`` `${count} page${count !== 1 ? "s" : ""} added` ``), inside a hook that already receives `props.t`
     and uses it on the next line (`:173`).
  And `org-settings-form.tsx:87`:
  ```ts
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
  ```
- **Target:**
  - Move the ten callback-error messages into `orgSettings.i18n.en.json`/`.de.json` under `integrations`,
    typed in `org-settings.types.ts`; pass `t.integrations` into the effect. Use the already-present
    `connectedSuccessfully` key at `:51`.
  - Add `noProvidersAvailable`; render `{t.noProvidersAvailable}`. Per Step 10's layout this belongs in its
    own `org-integrations-empty.tsx`.
  - Add `pagesAdded`, `pagesAddedWithSkipped`, `allAlreadyLinked` to the notebook `pagePicker`
    translations, rendered with the existing `{name}`-style placeholder substitution used at
    `components/integration-buttons.tsx:65`.
  - **Replace** the suppression with a `useRef` run-once guard (or list the genuinely stable deps).
    codebase.md is explicit: suppressions are fixed properly, never re-silenced and never `_`-prefixed.
  - Delete the two keys that stay dead — `workspaceLabel` and `connectedBy` — from the type and both JSON
    files. **`confirmDisconnectTitle` and `confirmDisconnectDescription` are now read by Step 12's dialog
    and must be kept** *(this reverses revision 1, which deleted all four)*. If Step 12 has not shipped
    when this step does, keep all four and delete nothing — deleting keys a queued step needs is the one
    ordering mistake here that the gate will not catch.
- **Risk:** this is the one step that changes rendered text, from English literals to translated keys. For
  `en` the strings must be **byte-identical** to today's, or P0.1 and any snapshot will (correctly) fail.
  The `useRef` guard must preserve the current once-per-mount semantics including React 18 double-invoke
  in development — the existing comment at `:45-46` explains why the toast id is stable; keep that.
  `pnpm check` runs the i18n check, so a key present in `en` but missing in `de` fails the gate.
- **Verify:** `pnpm check` (its i18n task is the real gate here);
  `pnpm --filter @scibly/app run test`; then
  `grep -rn "eslint-disable\|@ts-ignore\|@ts-expect-error" apps/app/src/features/organizations/settings apps/app/src/features/integrations apps/app/src/features/notebook/sources`
  returns **nothing** — down from the one suppression at baseline.

### Step 14: Unify the provider display registry

- **Files:** `apps/app/src/features/integrations/settings/components/org-integrations/provider-icon.tsx`,
  `apps/app/src/features/notebook/chat/provider-display.tsx`
- **Depends on:** Steps 1 and 10
- **Now:** two independent provider-display registries under different names, which **disagree about which
  providers exist**:
  ```ts
  // org-integrations-card.tsx:40 — exhaustive over IntegrationProviderId
  const PROVIDER_ICONS = { NOTION: NotionIcon, GITHUB: GitHubIcon }
    satisfies Record<IntegrationProviderId, React.ComponentType<{ className?: string }>>;

  // notebook/chat/provider-display.tsx:31 — keyed by bare string
  export const PROVIDER_DISPLAY = new Map<string, ProviderDisplayConfig>([
    ["NOTION", …], ["CONFLUENCE", …],   // no GITHUB
  ]);
  ```
  So a GitHub source in the notebook picker falls through to `PROVIDER_DISPLAY_FALLBACK`. Step 1 removes
  the `CONFLUENCE` entry; this step removes the *reason* a second registry could diverge at all.

  There is a **third** registry with the same shape:
  `notebook/workspace/utils/constants.ts:102` — `SOURCE_DISPLAY_MAP: Map<string, SourceDisplayConfig>`
  with a `DEFAULT_SOURCE_DISPLAY` fallback, keyed by lowercased `SourceType`. It is keyed by source type
  rather than provider, so it is not merged here, but it is the same anti-pattern (`Map<string, …>` +
  fallback = silent divergence) and it is why the convention added to `codebase.md` is worth having.
- **Target:** one registry keyed by `IntegrationProviderId` and declared
  `satisfies Record<IntegrationProviderId, …>` — so adding a provider fails to compile until its display
  entry exists — living next to `contracts.ts`, read by both the settings card and the notebook picker.
  Drop `PROVIDER_DISPLAY_FALLBACK` once the map is exhaustive.
- **Risk:** **this step changes what the notebook picker renders for a GitHub source** — today the
  fallback, afterwards the real GitHub entry. That is arguably fixing a bug rather than preserving
  behavior. Ship it as a deliberate, visible change, or hold it. Note also that
  `provider-display.tsx` defines the camelCase components `confluenceLogo` and `providerLogoFallback`,
  which codebase.md's React rules forbid; `confluenceLogo` is already deleted by Step 1, and renaming
  `providerLogoFallback` → `ProviderLogoFallback` belongs here since this step is already rewriting the
  file. `NotionLogoIcon` is already shared (`provider-display.tsx:6,37`, `source-list-item.tsx:7,75`) —
  reuse it rather than adding a third Notion icon.
- **Verify:** `pnpm check`; `pnpm --filter @scibly/app run test` — `source-list-item.test.tsx` exercises
  the notebook-side rendering.

### Step 15: Delete `pageCount` from the integration page contract

- **Files:** `apps/app/src/features/integrations/contracts.ts`,
  `apps/app/src/features/notebook/sources/ingestion/extractors/integration-extractors.ts`
- **Now:** `IntegrationPageContent.pageCount` (`contracts.ts:44`) is declared and forwarded into
  persistence (`integration-extractors.ts:58`), but the only implementation of `fetchPageContent`
  (`providers/notion.ts:147-152`) never sets it — so it is always `undefined` for integration sources.
  It belongs to the PDF path (`ingestion/parsers/pdf-parser.ts:98`), which sets it on its own extractor
  type.
- **Target:** drop the field from the interface and the forwarding line. If the persistence layer requires
  the key, pass `undefined` explicitly at the one call site rather than routing it through the contract.
- **Risk:** low — confirm with `grep -rn "pageCount" apps/app/src` that the PDF path's own `pageCount` is
  a separate type and is untouched.
- **Verify:** `pnpm check`; `pnpm --filter @scibly/app run test`.

## Behavior-changing fixes (separate — these are NOT refactors)

None of these belong in the steps above. They change what the code does; the user decides if and when they
ship. Ordered by severity. **BF-1 warrants attention before this branch reaches production.**

### BF-1 · CRITICAL · Cross-tenant GitHub installation takeover

- **Where:** `apps/app/src/features/integrations/server/providers/github/provider.ts:52`, reached from
  `server/connect-callback.ts:65`
- **Evidence:** the callback reads the installation id straight from the query string —
  ```ts
  // connect-callback.ts:65
  installationId: searchParams.get("installation_id"),
  ```
  — and the provider resolves it with the **app's own JWT**, which can see every installation of the app
  on any account:
  ```ts
  // providers/github/provider.ts:52
  const installation = await fetchInstallation(readGitHubAppConfig(), params.installationId);
  ```
  ```ts
  // providers/github/app-auth.ts — fetchInstallation
  await githubRequest(`/app/installations/${encodeURIComponent(installationId)}`,
    { method: "GET", authorization: `Bearer ${signAppJwt(config)}` });
  ```
  Nothing binds that id to the person completing the connect. `validateCallback` only proves the `state`
  was issued by us (HMAC-SHA256, timing-safe, 10-minute TTL — but **no nonce, so replayable**), and
  `authorizeCallback` only proves the caller is an admin of **their own** org.
  `grep -rn "user/installations\|user-to-server\|oauth/access_token" apps/app/src` returns **nothing** —
  there is no ownership check anywhere. `docs/runbooks/github-app.md:25` confirms this is by design today:
  *"Request user authorization (OAuth) during installation — **unchecked**"*, with the note "scibly never
  asks GitHub for a user token, only for the installation."
- **Impact:** an admin of any org calls `integration.getAuthUrl({ provider: "GITHUB" })` for their own
  org, then hits
  `/api/integrations/github/callback?state=<their own valid state>&installation_id=<victim's id>`.
  The connection persists pointing at the victim's installation. `listGrants` then mints a real
  installation token and returns the victim org's **private repository names and URLs**, and the stored
  connection carries the app's Contents/Issues/PR read access. Installation ids are small sequential
  integers, so finding other tenants of this app is trivial enumeration. Any scibly customer who connects
  GitHub is readable by any other scibly customer.
- **Recommendation:** enable *Request user authorization (OAuth) during installation* on the GitHub App,
  exchange the `code` GitHub returns for a user-to-server token, and verify `GET /user/installations`
  contains the submitted `installation_id` **before** persisting. Update
  `docs/runbooks/github-app.md:25` in the same change — the runbook currently instructs operators into the
  vulnerable configuration. Give the state a single-use nonce while in here
  (`apps/app/src/lib/crypto/oauth-state.ts` has none).

#### Answering the question: does this narrow who can use the connection? **[user-directed]**

> *"If we set OAuth as recommended, can we still connect it such that every member of an org has access —
> or more specifically admins and owners?"*

**Org-wide access is unaffected. Only who may complete the connect changes, and only slightly.**

1. **The user token is used once and thrown away.** It exists solely to answer "can *this* person see
   *that* installation?" at connect time. It is never written to `integration_connection` — the schema has
   no column for it — so its 8-hour expiry is irrelevant and no refresh is needed.
2. **Every later call is unchanged.** `resolveConnectionToken` → `mintAccessToken` signs a JWT with the
   app's own RSA private key and exchanges it for an *installation* token
   (`app-auth.ts`, `provider.ts:52`). That token is scoped to the installation, not to a person. So
   `listGrants`, source ingestion, and the daily sync behave identically for every member of the org
   regardless of who connected it — which is exactly the property `CONTEXT.md` describes under
   **Installation**: *"the token it stands for is minted from the app's own key… and never written down."*
3. **Scibly-side authorization does not move.** `authorizeCallback` already calls
   `requireOrgMember(organization.id, session.user.id, "admin_or_owner")`, and `getAuthUrl` /
   `disconnect` / `listGrants` all call `resolveOrg(..., "admin_or_owner")`. Admins and owners remain the
   ones who can connect and disconnect; ordinary members remain able to *use* the connection through
   notebooks. None of that is touched.
4. **The one real change:** the scibly admin who completes the connect must also be a GitHub user who can
   see that installation. A scibly admin with no GitHub relationship to the org being installed onto could
   no longer complete the connect — someone with GitHub access would have to. In practice that is the
   person who clicked "Install" on GitHub anyway, since GitHub redirects *them* to the callback.
5. **A plain member never reaches this at all.** The integrations settings page is admin/owner-only, so
   ordinary members see no providers and have no connect button — the "does a plain member still see it"
   question does not arise on the scibly side. The person completing a connect is always an admin or an
   owner, both before and after this change.
6. **What is left to verify is GitHub-side, and only for that admin.** GitHub documents
   `GET /user/installations` as returning installations "that the authenticated user has explicit
   permission (`:read`, `:write`, or `:admin`) to access" — **repository-access-based, not org-role-based**,
   so it does not require GitHub org ownership. Confirm against a real install that the account clicking
   through actually sees the installation; if some legitimate connector does not, accept **either** proof:
   the user token lists the installation, **or** the user is an admin/owner of the GitHub org that
   `fetchInstallation` reports as the installation's account. Both close the takeover.

### BF-2 · HIGH · Stored XSS — `javascript:` URLs pass `z.url()` and are rendered into `href`

- **Where:** validation via Zod, rendered at
  `apps/app/src/features/notebook/sources/components/source-list-item-actions.tsx:205` (`href={item.externalUrl}`)
- **Evidence:** verified empirically against the pinned **zod 4.4.3** in this repo:
  ```
  "javascript:alert(1)"               -> string().url(): true | z.url(): true
  "data:text/html,<script>a</script>" -> string().url(): true | z.url(): true
  "vbscript:x"                        -> string().url(): true | z.url(): true
  ```
  Zod's URL check only asks whether `new URL()` parses, which accepts any scheme. So yes — **this is
  really needed**; `z.string().url()` is not doing the job anyone reading it assumes it does.
- **Impact:** a value that reaches `externalUrl` is stored and later rendered as a clickable link. A
  `javascript:` href executes in the victim's session on click.
- **Recommendation — one shared schema, reused deliberately** **[user-directed]:**

  Put it in `packages/schemas/src/schema/common/index.ts` (new folder; the package's `exports` map
  `"./*": "./src/schema/*/index.ts"` picks it up with no config change), so both apps and packages reach
  it as `@scibly/common`:
  ```ts
  /**
   * A URL safe to put in an `href` or fetch: https only.
   * Zod's own `.url()` accepts any scheme `new URL()` parses — including
   * `javascript:`, `data:` and `vbscript:` — so it is not a safety check.
   * Use this anywhere a URL is stored, rendered as a link, or fetched.
   */
  export const httpsUrl = (message = "Must be a valid https:// URL") =>
    z.url({ protocol: /^https$/, message });
  ```
  Take the message as a parameter rather than hardcoding it — the repo has `zod-i18n.ts` and several call
  sites pass their own copy today.

  **Reuse at these sites (all currently `z.string().url()`):**

  | Site | Field | Why it qualifies |
  | --- | --- | --- |
  | `features/integrations/api/integration.schema.ts:45` | `pageUrl` | flows to `externalUrl`, rendered as `href` — the actual XSS path |
  | `features/integrations/api/integration.schema.ts:57` | `url` | same |
  | `features/course-authoring/.../course-validation.ts:39` | thumbnail | rendered as an image src |
  | `packages/schemas/src/schema/organization/index.ts:13` | `createOrganizationSchema.logo` | rendered, org-wide |
  | `packages/schemas/src/schema/organization/index.ts:28` | `updateOrganizationSchema.logo` | same |
  | `packages/schemas/src/schema/user/index.ts:235` | user image | rendered |
  | `features/.../image-schemas.ts:79,139` | image URLs | rendered |

  **Deliberately NOT changed — do not sweep these:**
  - `features/organizations/settings/api/org-ai-config.schemas.ts:32,46` — BYOAI `baseUrl`. Self-hosters
    legitimately point this at `http://localhost:11434` (Ollama) or an internal host. Forcing https here
    breaks a supported configuration. It is also server-to-server, never rendered as a link.
  - `notebook-tools.ts:17` — the web-fetch tool's argument, whose own doc comment says *"public HTTP or
    HTTPS URL"*. Narrowing it changes what the agent can fetch. If it is tightened later, that is a
    product decision, not this fix.

  **Defend at the render site too.** Rows already in the database were never checked, so schema-only
  validation leaves stored payloads live. Gate `source-list-item-actions.tsx:205` on the parsed protocol
  before rendering the anchor — belt and braces, and it is the half that protects existing data.
- **Rollout note:** this rejects input that used to be accepted, which is why it sits here rather than in
  the step list. Before shipping, run a read-only census:
  `SELECT DISTINCT split_part("externalUrl", ':', 1) FROM "notebook_source" WHERE "externalUrl" IS NOT NULL;`
  If anything other than `https` (and possibly `http`) appears, decide the migration story first.

### BF-3 · HIGH · A vanished connection row kills the entire sync chain

- **Where:** `server/sync-source-freshness.ts:181` (`recordAttempt`), reached from `:244`, `:266`, `:267`
- **Evidence:** `recordAttempt` uses `update`, which throws Prisma `P2025` when the row is gone:
  ```ts
  await db.integrationConnection.update({ where: { id: integrationId }, data });
  ```
  `syncConnection`'s `try/catch` (`:250-263`) wraps **only** the provider poll. The `recordAttempt` at
  `:244` (empty-sources branch), `markChangedSourcesStale` at `:266`, and `recordPollSuccess` at `:267`
  are all outside it. A throw there escapes to `runSyncStep`'s outer catch (`:314`), which releases the
  lease and returns `{ continued: false }`.
- **Impact:** if a user disconnects (`integration-connection-procedures.ts:140` deletes the row) or
  `forgetRevokedConnection` deletes it while a hop is running, **every remaining connection in the chain
  is dropped for that run** — and since the cron is daily (`apps/app/vercel.json` → `"0 4 * * *"`),
  "that run" means a whole day.
- **Recommendation:** use `updateMany({ where: { id } })`, a no-op on a missing row, and wrap the
  per-connection body so no single connection can abort the hop.

### BF-4 · HIGH · Reconnecting does not clear the backoff, so a fixed integration stays dark

- **Where:** `server/connect-callback.ts:223-241`
- **Evidence:** the upsert's `update` branch carries only credentials and workspace:
  ```ts
  const connectionData = {
    ...credentialColumns(credential),
    workspaceId: credential.workspaceId ?? null,
    workspaceName: credential.workspaceName ?? null,
    connectedByUserId: callback.connectedByUserId,
  };
  ```
  `consecutiveFailures`, `nextPollAfter` and `lastPolledAt` survive untouched.
- **Impact:** a connection whose token was revoked accumulates failures until `nextPollAfter` is up to
  **7 days** out (`SYNC_BACKOFF_CAP_MS`). The admin reconnects, the settings card shows healthy, and
  `loadOwedConnections` keeps excluding it for the rest of the backoff. On a workspace change the stale
  `lastPolledAt` from the *previous* workspace is carried over too.
- **Recommendation:** add `consecutiveFailures: 0, nextPollAfter: null` to `connectionData`, and
  `lastPolledAt: null` on the workspace-changed path. Ships naturally inside BF-11's transaction.

### BF-5 · HIGH · A failed chain handoff is reported as success and strands the lease

- **Where:** `server/sync-source-freshness.ts:321-341`
- **Evidence:** the response status is never inspected:
  ```ts
  await fetch(routes.app.api.cron.syncIntegrations, {
    method: "POST",
    headers: { authorization: `Bearer ${env.CRON_SECRET}`, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  ```
  and the `!env.CRON_SECRET` branch at `:322-327` logs and **returns normally**. Either way
  `runSyncStep` reaches `return { totals, continued: true }` (`:313`) without calling `releaseSyncLease`.
- **Impact:** a 401 or 500 on the handoff — or an unset `CRON_SECRET` — leaves the chain dead while the
  lease is held for its full `SYNC_LEASE_MS` (10 minutes), blocking every trigger in between, with only a
  console line to show for it.
- **Recommendation:** check `response.ok`, log the status, release the lease when the handoff did not
  land, and return `continued: false` so the next trigger starts a fresh chain immediately.

### BF-6 · HIGH · A single 404 permanently deletes a connection and detaches all its sources

- **Where:** `server/connection-token.ts:50-51` (`forgetRevokedConnection`)
- **Evidence:**
  ```ts
  await detachSourcesFromConnection(connection.id, providerId, "disconnected");
  await db.integrationConnection.deleteMany({ where: { id: connection.id } });
  ```
  Two unrelated writes, **no `$transaction`**. `providers/github/provider.ts:71` maps **any** 404 to
  `IntegrationRevokedError`, and GitHub answers 404 for every installation the *presenting app* cannot
  see — including a `GITHUB_APP_ID`/`GITHUB_APP_PRIVATE_KEY` pair pointing at a different app.
- **Impact:** one misconfigured deploy (staging key in prod, a rotated or re-created app) destroys **every
  org's** GitHub connection and rewrites `warning` on all their sources — triggered from a read path
  (`listGrants`), with no undo and no confirmation. If the `deleteMany` fails after the detach commits,
  sources are orphaned while the settings card still shows the integration connected.
- **Recommendation — two independent fixes, both wanted:**
  1. **Atomicity** **[user-directed]:** wrap both writes in one `prisma.$transaction`, which requires the
     `detachSourcesFromConnection(..., client)` signature change described under *Transaction audit*:
     ```ts
     await db.$transaction(async (tx) => {
       await detachSourcesFromConnection(connection.id, providerId, "disconnected", tx);
       await tx.integrationConnection.deleteMany({ where: { id: connection.id } });
     });
     ```
  2. **Blast radius:** require corroboration before deleting anything — confirm the app itself is
     reachable via `GET /app/installations`, or mark the connection `revokedAt` and let an explicit
     disconnect/reconnect clean it up. A transaction makes the destruction atomic; it does not make it
     correct.

### BF-7 · MEDIUM · Backoff cap equals the polling-window floor, so a recovered connection loses changes

- **Where:** `server/sync-source-freshness.ts:34` and `:175-179`
- **Evidence:** `SYNC_BACKOFF_CAP_MS = TimeHelpers.IN_MS.DAY * 7` and
  `SYNC_WINDOW_FLOOR_MS = TimeHelpers.IN_MS.DAY * 7` — **identical**. `getPollingStart` clamps with
  `Math.max(lastPolledAt - skew, now - SYNC_WINDOW_FLOOR_MS)`.
- **Impact:** after the escalating ladder (6h → 1d → 3d → 7d …) a recovering connection is easily 10+ days
  past its watermark, so its first successful poll asks only about the last 7 days and the intervening
  edits are never marked stale — no warning, no second chance. This contradicts `CONTEXT.md`'s Watermark
  definition: *"the next success covers the whole gap."*
- **Recommendation:** the cap must sit strictly below the floor — cap the backoff at 24h — or, when
  `now - lastPolledAt > SYNC_WINDOW_FLOOR_MS`, fall back to a per-source revision re-check instead of the
  changed-since query. The floor itself is deliberate and pinned by tests; do not move it.

### BF-8 · MEDIUM · Three ingestion entry points bypass the `source.ingest` rate limit

- **Where:** `api/integration-page-procedures.ts` — `linkPages` (`:39`), `linkPage` (`:63`),
  `resyncSource` (`:101`, calling `ingestOrRefreshSource` directly at `:126`)
- **Evidence:** every other ingestion path goes through `boundedIngest`
  (`notebook/sources/api/bounded-ingest.ts:8-13`), which wraps `withRateLimit` on endpoint
  `source.ingest` — used at `source.router.ts:154`, `source-upload-procedures.ts:129` and `:202`. These
  three procedures are plain `protectedProcedure` with no limiter.
- **Impact:** the abusable ingestion work is reachable unmetered, and `linkPages` fans out up to 20
  ingestions per call.
- **Recommendation:** route all three through `boundedIngest`, matching the rest of the ingestion surface.

### BF-9 · MEDIUM · GitHub repository list is silently truncated at 100

- **Where:** `server/providers/github/app-auth.ts:153-159` (server) and
  `settings/components/org-integrations-card.tsx:143-202` (`ProviderGrants`, client)
- **Evidence:** `githubRequest("/installation/repositories?per_page=100", …)` — `total_count` in the
  response is ignored and no `page=` parameter is ever sent. On the client, `ProviderGrants` then renders
  **every** returned grant as a flex-wrap chip:
  ```tsx
  <ul className="flex flex-wrap gap-1.5">
    {data.grants.map((grant) => (
      <li key={grant.id}><a href={grant.url} …>{grant.name}<ExternalLink /></a></li>
    ))}
  </ul>
  ```
  So an org-wide install on a 400-repo account shows 100 chips, in a settings card, with nothing
  indicating the other 300 exist — contradicting `CONTEXT.md`'s **Grant** as *what the installation was
  let at*.
- **Recommendation — fix both halves** **[user-directed]:**

  **Server — page until complete.** Loop on `page` until the accumulated length reaches `total_count`,
  with a hard page cap (say 10 pages / 1000 grants) so a pathological account cannot hang a hop. Return
  the total alongside the list so the client can be honest about a cap that *was* hit:
  ```ts
  return { grants, totalCount, truncated: grants.length < totalCount };
  ```
  `listGrants` is a query on the settings page, not on the sync path, so the extra round trips cost a
  slower settings card and nothing else. Do this together with BF-10's schema parsing — it is the same
  function.

  **Client — first four, then a modal.** `ProviderGrants` renders the first 4 chips and, when there are
  more, a `242 more` affordance that opens a dialog listing all of them:
  ```tsx
  const VISIBLE_GRANTS = 4;
  const visible = data.grants.slice(0, VISIBLE_GRANTS);
  const hiddenCount = data.grants.length - VISIBLE_GRANTS;
  ```
  - The affordance is a `<button>`, not a link — it opens a dialog, and a link that does not navigate is
    an accessibility bug.
  - Use `Dialog` from `@scibly/ui` (`packages/ui/src/components/dialog/index.tsx`, which exports
    `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`,
    `DialogTrigger`, `DialogClose`) — **not** `AlertDialog`, which is for confirmations. Step 12's
    disconnect dialog is the `AlertDialog` case; this is the plain-dialog case.
  - Wrap the full list in `ScrollArea` (`apps/app/src/shared/ui/components/scroll-area.tsx`) with a capped
    height — 400 repositories in an unbounded dialog is its own problem.
  - New file per codebase.md: `org-integrations/provider-grants-dialog.tsx` exporting
    `ProviderGrantsDialog`. `ProviderGrants` keeps the query and owns the open state.
  - **Two new i18n keys**, in both locales and `org-settings.types.ts`. The count must be a placeholder,
    not concatenation — `"grantsMore": "{count} more"` and `"grantsDialogTitle": "Has access to"` — using
    the same `{name}`-style substitution as `components/integration-buttons.tsx:65`. German needs the
    placeholder form anyway.
  - If the server reports `truncated`, say so in the dialog rather than silently showing 1000 of 4000.
- **Depends on:** Step 10 (the component folder) for the new file to have a home.

### BF-10 · MEDIUM · Unvalidated GitHub JSON is cast, and the comment justifying it is false

- **Where:** `server/providers/github/app-auth.ts:106`
- **Evidence:**
  ```ts
  // SAFETY: the body is GitHub's documented response for the path the caller
  // asked for, and every field GitHub may omit is checked before it is used.
  return (await response.json()) as T;
  ```
  Only `fetchInstallation` (`:125`) actually checks a field. `:146` returns `minted.token` unchecked, and
  `:159` returns repository objects whose `id`/`full_name`/`html_url` are never checked.
- **Impact:** a malformed `mintInstallationToken` body yields `undefined` typed as `string`, which is then
  sent onward as a bearer token.
- **Recommendation:** follow the repo's own idiom for third-party HTTP JSON —
  `features/organizations/settings/server/endpoint-probe.ts:51` does
  `modelsCatalogSchema.parse(await response.json())`. Give `githubRequest` a `schema: z.ZodType<T>`
  parameter, parse instead of cast, and delete the false comment. Ship together with BF-9's pagination —
  same function, and the paged response shape wants a schema anyway.

### BF-11 · MEDIUM · Connect callback read-then-write race; the detach commits on its own

- **Where:** `server/connect-callback.ts:196` (read) → `:216` (detach) → `:231` (upsert)
- **Evidence:** a `findUnique` for `existing`, then a provider round-trip **seconds wide**, then a
  conditional `detachSourcesFromConnection` and an `upsert` — none of it in a transaction.
- **Impact:** two callbacks in flight both see the same `existing` and both upsert; the loser can hit
  P2002 and be reported to the admin as `token_exchange_failed`. Worse, the detach at `:216` commits
  independently — if the upsert then fails, the org's sources are permanently detached while the settings
  card still shows the old workspace connected.
- **Recommendation** **[user-directed]:** run the detach and the upsert in one `prisma.$transaction`,
  re-reading `existing` inside it. Note the shape carefully — the provider round-trip must stay
  **outside** the transaction:
  ```ts
  const credential = await provider.completeConnect(params, redirectUri);  // network — outside
  await db.$transaction(async (tx) => {
    const existing = await tx.integrationConnection.findUnique({ … });      // re-read inside
    if (workspaceChanged(existing, credential)) {
      await detachSourcesFromConnection(existing.id, provider.providerId, "workspace_changed", tx);
    }
    await tx.integrationConnection.upsert({ … });
  });
  ```
  Holding a transaction open across the provider call would pin a pooled connection for the length of a
  network round-trip, which `packages/db`'s serverless tuning is specifically against. Fold BF-4's
  `consecutiveFailures: 0, nextPollAfter: null` into the same `update` branch while here.

### BF-12 · MEDIUM · "Select all" can exceed the 20-page cap and fail the whole batch

- **Where:** `notebook/sources/page-picker/use-page-picker-controller.ts:127`
- **Evidence:** selection is bounded by `remaining` (`sourceLimit - totalSourceCount`,
  `page-picker-content.tsx:131`), but `sourcesPerNotebook` is `EFFECTIVELY_UNLIMITED` (1e9) on paid plans,
  while `linkPagesSchema` caps `pages` at `.max(20)` (`api/integration.schema.ts:61`).
- **Impact:** on any plan above TRIAL, selecting all children of a large Notion parent and pressing Add
  fails the entire mutation, and `onError` toasts the raw untranslated Zod message.
- **Recommendation:** bound selection by `Math.min(remaining, MAX_LINKED_PAGES_PER_REQUEST)` using a
  constant exported from the schema module, and show the cap in the select-all bar.

### BF-13 · MEDIUM · A failed disconnect disables the button until remount

- **Where:** `settings/components/org-integrations-card.tsx:258`
- **Evidence:** `onSuccess` calls `setDisconnectingId(null)` (`:255`); `onError` is
  `(err) => toast.error(err.message)` (`:258`) and clears nothing. `isDisconnecting` (`:277`) feeds
  `disabled` (`:116`).
- **Impact:** after one transient failure the user is told it failed and then cannot retry.
- **Recommendation:** reset the id in `onSettled` rather than `onSuccess`. Ships cleanly alongside Step 11;
  update P0.1's quirk assertion in the same commit. **Ship it before Step 12** — a confirmation dialog on
  top of a button that latches disabled after one failure is a worse experience than either alone.

### BF-14 · MEDIUM · `ensureNotebook()` rejections are dropped

- **Where:** `notebook/sources/sources-panel.tsx:72` and `:155`
- **Evidence:** `void ensureNotebook().then(…)` with no `.catch()`. `ensure` is
  `mutation.mutateAsync(...)` (`chat/runtime/use-notebook-sync.ts:159`), so it rejects on any server error.
- **Impact:** the user clicks the GitHub/Notion button and **nothing happens**; an unhandled rejection is
  logged. At `:155` the same shape loses the text typed into the paste dialog.
- **Recommendation:** add `.catch()` on both, routing through the existing `reportSourceError` helper.

### BF-15 · MEDIUM · The sync lease token is neither rotated nor cleared

- **Where:** `server/sync-source-freshness.ts:111` (`releaseSyncLease`) and `:97-100` (`continueSyncLease`)
- **Evidence:** release sets `heartbeatAt: new Date(0)` but leaves `token` on the row, and
  `continueSyncLease` matches on `{ id, token }` only — nothing distinguishes the first delivery of a
  chain kick from a duplicate.
- **Impact:** two POSTs carrying the same token both get a live lease and run hops concurrently — exactly
  the double-poll/watermark race the lease exists to prevent. Confidence medium: this needs a duplicate
  delivery to trigger.
- **Recommendation:** rotate the token on every hop (return a fresh one from `continueSyncLease` and
  require it on the next POST), or clear `token` in `releaseSyncLease` alongside the epoch heartbeat.

### BF-16 · MEDIUM · No timeout on provider calls inside a hop

- **Where:** `server/sync-source-freshness.ts:298`; `providers/github/app-auth.ts:83`
- **Evidence:** the deadline is checked only *after* a connection finishes
  (`if (Date.now() - hopStartedAt >= SYNC_HOP_DEADLINE_MS)`), and neither `pollModifiedPages` nor
  `githubRequest` passes an `AbortSignal`.
- **Impact:** `SYNC_HOP_DEADLINE_MS` is 4 min against the route's `maxDuration = 300`, leaving 60s of
  slack. One hung provider call overruns it, the invocation is killed mid-hop, no attempt is recorded, and
  the lease is only recovered when it expires.
- **Recommendation:** give each provider call an `AbortSignal.timeout` sized to fit the remaining hop
  budget.

### BF-17 · MEDIUM · `disconnect` detaches then deletes without a transaction **[user-directed]**

- **Where:** `api/integration-connection-procedures.ts:135-142`
- **Evidence:** the same un-atomic shape as BF-6, on the path a user actually clicks:
  ```ts
  if (connection) {
    await detachSourcesFromConnection(connection.id, input.provider, "disconnected");
    await db.integrationConnection.delete({ where: { id: connection.id } });
  }
  return { success: true };
  ```
- **Impact:** if the `delete` fails after the detach commits, every source loses its `integrationId` and
  gains a "was disconnected" warning while the connection row survives — so the settings card still shows
  the integration connected, and reconnecting will not re-link the orphaned sources. The mutation reports
  success either way, because the throw happens after the detach and the client sees only the error, not
  the half-done state.
- **Recommendation:** one `prisma.$transaction`, using the `client` parameter from the *Transaction audit*
  change. Also note `delete` throws P2025 on a missing row where `deleteMany` would not — with a
  transaction around it that becomes a clean rollback rather than a partial write, so it can stay
  `delete`.
- **Related:** `detach-sources.ts:16-20` writes the `warning` text as **hardcoded English into the
  database**, so it is not translatable after the fact and is the same string for every locale. Out of
  scope for this branch (it is a data-model question — the warning should be a code plus params, resolved
  at render time), but worth an issue.

### BF-18 · LOW · The sync hop's two writes are not batched

- **Where:** `server/sync-source-freshness.ts:266-267`
- **Evidence:** `markChangedSourcesStale` then `recordPollSuccess`, sequentially, no transaction. A crash
  between them leaves sources marked stale while the watermark has not moved.
- **Impact:** benign in practice — the next poll re-covers the same window and re-marks the same sources,
  which is idempotent. Listed for completeness because the transaction sweep would otherwise look like it
  missed a site.
- **Recommendation:** `db.$transaction([markChangedSourcesStale(...), recordPollSuccess(...)])` as a
  **batch after** the provider call returns. Do **not** wrap the provider call itself — see the
  *Transaction audit* note on serverless connection pooling. Low priority; fold it into BF-3's rework of
  the same block rather than spending a commit on it.

## Not doing

- **Rename `IntegrationRevokedError` → `ConnectionRevokedError`.** Correct per `CONTEXT.md` (what was
  revoked is a connection), but it is a three-call-site rename whose value is swamped by Step 9 already
  rewriting that file — fold it in there if convenient, don't spend a step on it.
- **Reword the "refresh" comments in `packages/db/schema/integration.prisma:35,41,64`.** Real vocabulary
  drift (the scheduled run is a Sync), but comment-only, in a package outside the app, and cheaper to fix
  the next time the schema is touched.
- **Make the three GitHub App env vars optional.** *(Was BF-17 in revision 1.)* `env.js:50-53` requires
  `GITHUB_APP_SLUG`, `GITHUB_APP_ID`, `GITHUB_APP_PRIVATE_KEY` unconditionally, matching the
  `NOTION_CLIENT_ID`/`NOTION_CLIENT_SECRET` treatment two lines above. Self-hosters who do not want GitHub
  already have the documented escape hatch: `apps/app/src/env.js:153` reads
  `skipValidation: !!process.env.SKIP_ENV_VALIDATION`. Adding `.optional()` plus a `refine` plus a
  throw-at-use in `readGitHubAppConfig()` buys a narrower version of what that flag already provides, at
  the cost of moving a boot-time failure to a runtime one. **Decision: keep them required.** **[user-directed]**
- **Wire up `refreshToken` instead of deleting it.** Adding token-refresh behavior that does not exist
  today is a feature. Step 9 records the reasoning.
- **Inline `PagePickerBody` into `PagePickerContent`** (`page-picker-content.tsx:39`, the `props={props}`
  bag). Genuine indirection with no boundary behind it, but pre-existing, untested, and unrelated to what
  this branch does — churn on a file the branch only grazed.
- **Give `SourcesPanelPresentationProps.picker` an explicit interface** instead of
  `ReturnType<typeof useIntegrationPicker>` (`sources-panel.tsx:101`). Same reasoning: pre-existing, and
  the implicit contract has not actually bitten anyone.
- **Split `sync-source-freshness.test.ts` (738 lines) or `connect-callback.test.ts` (542) for size.**
  Both read as specifications, with requirement-tagged `describe` blocks and shared builders keeping each
  case short. Step 8 moves test blocks to follow their source — never to reduce line count.
- **Thread `SyncRunTotals` differently, or remove it.** It is a mutable out-parameter no production caller
  reads (`route.ts` discards `runSyncHop`'s return value), but the tests assert on it, so it is the
  test seam. Leave it.
- **Parallelise the hop loop** with `mapWithConcurrency`
  (`notebook/sources/ingestion/map-with-concurrency.ts`, `INGEST_CONCURRENCY = 4`). Tempting — the loop is
  strictly serial — but concurrency inside a leased hop interacts with the deadline check, the watermark,
  and BF-15. Not a behavior-preserving refactor; revisit once BF-3/BF-5/BF-15 are settled.
- **`resolveConnectionRow` does `findUnique` with no `select`.** Overfetching, but the row never crosses
  the tRPC boundary (verified) and it is one row per call. Not worth a step; tighten it if that file is
  opened for another reason.
- **Merge `SOURCE_DISPLAY_MAP` into the unified provider registry** (Step 14). It is keyed by source type,
  not provider, so merging them would conflate two different axes. Its `Map<string, …>` + fallback shape
  is the same anti-pattern and is now covered by the convention added to `codebase.md`, which is the
  cheaper fix.
- **Rename the `NotebookSource.integrationId` column to `connectionId`.** Correct per `CONTEXT.md`, but it
  needs a migration plus a coordinated deploy for one word. Step 6 confines the mismatch to the Prisma
  `where` clauses, which is most of the benefit for none of the risk.

## Changes to `references/codebase.md`

Applied to `.claude/skills/refactor/references/codebase.md` in this run **[user-directed]** — four
conventions this review surfaced that the reference did not state. See that file for the final wording.

1. **`CONTEXT.md` vocabulary is binding on identifiers, not just prose.** Steps 6 and 8 came entirely from
   `_Avoid_` lists. Reviewers diff function, type, and constant names against the feature's `CONTEXT.md`
   before flagging anything else about naming.
2. **Third-party HTTP JSON is parsed with a Zod schema, never cast.** The repo already has the idiom
   (`endpoint-probe.ts:51`); `app-auth.ts:106` shows what happens without the rule written down —
   including a `SAFETY:` comment asserting checks that two of three call sites do not perform. A
   `SAFETY:`-style comment is not a substitute for a parse.
3. **Display registries must be exhaustive over their id union** (`satisfies Record<Id, …>`), so adding a
   member fails to compile until every registry is updated. `PROVIDER_ICONS` does this; `PROVIDER_DISPLAY`
   and `SOURCE_DISPLAY_MAP` are `Map<string, …>` with a fallback, and have silently diverged.
4. **URLs are built by `@scibly/routes`.** Template-literal URL construction at a call site — especially
   one reading `process.env` directly — is a finding; the routes package already loads the base URLs
   through `loadPackageEnv`.
