# scibly-lms codebase context for reviewers

Include this file verbatim in every reviewer prompt. It describes where things
belong, how this repo does things, and the stack-specific failure modes worth
hunting. When in doubt, the surrounding code is the authority — read it.

## Repo map (pnpm + turbo monorepo)

- `apps/app` — the main Next.js LMS application (`@scibly/app`). App code in
  `apps/app/src`: `app/` (App Router), `components/`, `editor/` (TipTap),
  `hooks/`, `lib/`, `server/`, `trpc/`.
- `apps/web` — marketing/web Next.js app. `apps/collab` — Hocuspocus/Yjs
  collaboration server.
- `packages/api` — tRPC layer: `src/trpc.ts` (procedure definitions),
  `src/router/` (routers), `src/custom-error.ts` + `custom-error-constants.ts`
  (error handling), `src/rate-limit.ts`, `src/api-messages.ts` + `src/i18n/`
  (localized API messages).
- `packages/db` — Prisma client and schema.
- `packages/schemas` — Zod (v4) schemas in `src/schema/`, organized by domain
  (`user/`, `organization/`), with i18n-aware messages via `zod-i18n.ts`.
- `packages/auth` — better-auth setup. `packages/ui` — shared Radix-based
  components. `packages/lib` — shared utilities. `packages/i18n` — translations.
- `packages/routes` — route definitions. `packages/email` — Resend emails.

**Boundary rule:** logic reused across apps belongs in a package; Zod schemas
belong in `packages/schemas`, not inline next to a router or component; DB
access goes through `packages/db`. New code duplicating something a package
already provides is a finding.

## Commands

- `pnpm check` — i18n check + typecheck + lint for all apps (the fast gate).
- `pnpm --filter @scibly/app run test` — Vitest unit tests;
  `... run test:e2e` — Playwright. `pnpm test:all` / `pnpm validate` — full gates.

## tRPC (`packages/api`)

- Procedures: `publicProcedure` and `protectedProcedure` from `src/trpc.ts`.
  A mutation or query on user-owned data built on `publicProcedure`, or a
  `protectedProcedure` that checks login but not _ownership/membership of the
  specific resource_ (IDOR), is a top-priority finding.
- Errors go through the custom error machinery (`custom-error.ts`,
  `custom-error-constants.ts`) with localized messages via `api-messages.ts` —
  ad-hoc `throw new TRPCError` with hardcoded English strings is a convention
  violation.
- Expensive or abusable endpoints (AI generation, uploads, email) should use
  `rate-limit.ts`. New expensive endpoints without rate limiting are a finding.
- Input validation: every procedure input is a Zod schema, preferably imported
  from `packages/schemas`. Inline `z.object(...)` for a shape that also exists
  as a form schema or another procedure's input is duplication.
- Client side: tRPC via TanStack Query (`packages/api/src/react.ts`,
  `apps/app/src/trpc`). Manual `fetch` to internal endpoints where a tRPC hook
  exists is a finding. Check mutation `onSuccess` handlers invalidate the
  queries they stale.

## Prisma (`packages/db`)

- N+1: queries inside loops or `Promise.all` over IDs where a single
  `findMany`/`include` would do.
- Overfetching: `findMany` without `select` whose result crosses the tRPC
  boundary — leaking whole rows (password hashes, tokens, internal flags) to
  the client is both a perf and a security finding.
- Unbounded lists: `findMany` without `take` on tables that grow with usage.
- Multi-write invariants (e.g. create + counter update) belong in
  `prisma.$transaction`.
- Connection handling was deliberately tuned for serverless — flag new
  `PrismaClient` instantiations outside `packages/db`. In particular, never
  hold a `$transaction` open across an external HTTP call: the pool is sized
  for serverless, and a multi-second provider round-trip inside a transaction
  is an outage under concurrency. Keep the external call outside and wrap only
  the database statements.
- **Check whether a migration has shipped before planning around it.** A
  migration still absent from `origin/main` has never been applied to a
  production database, so a column rename is an edit to that migration's SQL in
  place — no second migration, no backfill, no data risk. Confirm with
  `git cat-file -e origin/main:packages/db/migrations/<name>/migration.sql`
  (non-zero exit = branch-local). This inverts the usual advice, so state the
  check in the plan rather than the conclusion: the window closes the moment
  the branch merges, and a plan that says "renaming is free" without saying why
  becomes wrong silently.

## TipTap / ProseMirror / Yjs

- Layout: reused content primitives live in `src/shared/content/editor/`
  (QA/exercise blocks under `blocks/questions/`, e.g. `cloze-text/`).
  Authoring-only menus, AI insertion, and document mutation live in
  `src/features/course-authoring/scenes/editor/`.
- **Collab constraint:** documents sync via Yjs (Hocuspocus, `apps/collab`).
  All document changes must go through ProseMirror transactions — direct node
  attr mutation, storing doc-derived state outside the doc, or `setTimeout`-based
  "sync" is a correctness finding (breaks under concurrent editing).
- The established pattern for keeping node attrs consistent with doc content is
  an `appendTransaction` plugin — see
  `src/shared/content/editor/blocks/questions/cloze-text/cloze-sync-plugin.ts`.
  Ad-hoc sync via
  React effects or update handlers should be flagged for porting to this pattern.
- Position handling: absolute positions held across transactions must be mapped
  (`tr.mapping.map`) — stored raw positions are latent bugs.
- NodeViews/React components subscribed to editor state re-render on every
  transaction unless selectors/equality checks are used — a hot path worth
  checking in large documents.

## React 19 / Next.js App Router (`apps/app`)

- Server/client split: `"use client"` creeping up the tree pulls server-only
  work into the bundle; `server-only`-guarded modules imported from client code
  is a build-correctness finding.
- Sequential `await`s of independent data in server components/procedures are
  waterfall findings.
- Client state: Zustand for shared client state, react-hook-form + Zod
  resolvers (`@hookform/resolvers`) for forms. useState-lifting sprawl or a
  second ad-hoc store pattern is a finding.
- Effects: data fetching belongs in tRPC/TanStack Query, not `useEffect`;
  missing cleanup (subscriptions, observers, editor instances) and
  stale-closure bugs are classic issues in the editor-adjacent code.
- User-generated HTML must go through `dompurify` before any
  `dangerouslySetInnerHTML`.
- **The middleware is `apps/app/src/proxy.ts`, not `middleware.ts`.** This
  version renamed it. `grep`ing for `middleware.ts` returns nothing and does
  **not** mean the app is unguarded. `proxy.ts` exports `config.matcher` plus
  `proxy = createAppProxy()` → `createSciblyProxy(baseProxy())` in
  `packages/next-proxy/`. `baseProxy` ends every unmatched request at
  `createRedirectWithLocale`, which prepends a locale when the first segment is
  not one — so `[lang]` is always a real `Locale` by the time a layout sees it.
  The one bypass is `checkStaticFiles` (`static-assets.ts`): `/_next/*` and any
  pathname ending in a media/text extension return `NextResponse.next()`
  untouched.
- **Route params are still untrusted input.** `generateStaticParams` does not
  restrict which params render — `dynamicParams` defaults to `true`, so the
  proxy is the only thing narrowing them, and it is one `matcher` or
  `skipPathPrefixes` edit away from not being. Narrow a route param to its
  domain type at the layout boundary (`getLocale(lang, true)`) before passing it
  on, and never interpolate one into `dangerouslySetInnerHTML`: `JSON.stringify`
  does not escape `<`, so it cannot stop a `</script>` breakout.

### Feature component folders

Large features use **context subfolders** under `components/`. Group by
feature/domain — not flat dumps at the same level. One React component per
`.tsx` file (including skeletons and empty states). Filenames: kebab-case;
exports: PascalCase components, camelCase hooks/helpers
(`@typescript-eslint/naming-convention`). Co-locate feature hooks, helpers, and
tests in the same subfolder; shared UI goes in `packages/ui`.

Examples below are **fictional** — use them as the pattern spec; do not hunt
for these names in the repo.

```
components/
  order-summary/
    order-summary-view.tsx       → export function OrderSummaryView
    order-summary-line-item.tsx  → export function OrderSummaryLineItem
    order-summary-skeleton.tsx   → export function OrderSummarySkeleton
    use-order-summary.ts         → export function useOrderSummary
    format-order-total.ts        → export function formatOrderTotal
```

| Artifact    | Filename                      | Export name            |
| ----------- | ----------------------------- | ---------------------- |
| Component   | `order-summary-line-item.tsx` | `OrderSummaryLineItem` |
| Hook        | `use-order-summary.ts`        | `useOrderSummary`      |
| Pure helper | `format-order-total.ts`       | `formatOrderTotal`     |

**Finding:** one `.tsx` file defines multiple JSX-returning components (e.g.
`OrderSummaryView`, `OrderSummarySkeleton`, and `OrderSummaryEmpty` together).

### No `createElement` or camelCase component renames

Agents define camelCase functions and render via `createElement` to dodge
PascalCase lint — **always a finding** in feature UI code. Split into separate
files and use JSX. Legitimate `createElement` is for non-UI cases only (e.g. MDX
dynamic tags, ProseMirror DOM helpers).

```tsx
// BAD
function orderSummarySkeleton() {
  return <div className="animate-pulse" />;
}
export function OrderSummaryView() {
  return createElement(orderSummarySkeleton);
}

// BAD
import { OrderSummaryEmpty as orderSummaryEmpty } from "./order-summary-empty";
createElement(orderSummaryEmpty, { message: "No orders" });
```

```tsx
// GOOD — order-summary-skeleton.tsx
export function OrderSummarySkeleton() {
  return <div className="animate-pulse" />;
}

// GOOD — order-summary-view.tsx
import { OrderSummarySkeleton } from "./order-summary-skeleton";
export function OrderSummaryView() {
  return <OrderSummarySkeleton />;
}
```

Flag `import { createElement } from "react"` in client component files used
with camelCase function components or camelCase import aliases.

### Type and lint hygiene (fix properly, no suppressions)

`pnpm check` must pass without new escape hatches. Every suppression is a
finding. Do not add `eslint-disable`, `@ts-ignore`, `@ts-expect-error`, or
`_`-prefixed unused vars; delete dead code, wire values, or narrow types.

```ts
// BAD
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _unusedId = row.id;

// BAD
const items = data as any;

// GOOD — use or remove
const id = row.id;
void persistId(id);

// GOOD — narrow or validate
const items = orderItemsSchema.parse(data);
```

## AI features (Vercel AI SDK, `ai`, `@ai-sdk/*`)

- Streaming endpoints must handle abort/disconnect (leaked generations cost
  money) and be rate-limited.
- Prompt construction that interpolates raw user/document content should keep
  user content clearly delimited from instructions (prompt-injection surface,
  especially for tools like website fetching in the notebook agent).
- Model/provider config belongs centralized, not hardcoded per call site.
- AI output parsed into structured data (e.g. generated exercises/cloze gaps)
  must be validated with a Zod schema before persisting — trusting model output
  shape is a correctness finding.

## i18n

- User-facing strings are translated via `packages/i18n` / next-intl-style
  messages; API messages via `packages/api/src/i18n`. Hardcoded user-facing
  English strings in components or procedures are findings. `pnpm check`
  includes an i18n consistency check — new keys must pass it.
- A feature's `*.types.ts` should be **derived from the English JSON**, not
  hand-transcribed: `export type XTranslations = (typeof xEn)["a"]["b"];` (3-4
  lines — see the seven files under `apps/app/src/features/notebook/*/i18n/`).
  The hand-written style is still the majority (17 files, 9-152 lines each) and
  is where dead keys hide: nothing ties the interface to the JSON, so removing a
  key means editing three files by hand and a stale key never fails to compile.
  Deriving also removes the `as XTranslations` casts such files force on tests.
  Worth proposing whenever a refactor touches a feature's i18n anyway.

## Observability (`packages/observability`, `apps/web`)

- Apps import `@scibly/observability/*` only — never `@posthog/*` directly.
- Client shell: single `PostHogProvider` tree in `next/client-root.tsx` with
  `opt_out_capturing_by_default`; consent toggles use `opt_in_capturing` /
  `opt_out_capturing`, not a noop provider sibling.
- Server capture: `server/index.ts` owns consent parsing, distinct id resolution,
  and `captureServerEvent`. No literal `"anonymous"` distinct id — skip capture
  when neither PostHog cookie nor `context.distinctId` is available. Pending
  consent still captures when `context.distinctId` is set (marketing flows).
- Web marketing events: `apps/web/src/server/marketing.ts` owns event names,
  `captureMarketing`, and marketing error taxonomy. Flows pass
  stable per-email distinct ids when needed.
- FAQ UI: `apps/web/src/components/faq/faq-list.tsx` for all FAQ accordions;
  homepage Q&A lives in `faq.i18n.*.json` (stable `id` per question).
- Proxy matcher literals stay inline in each app's `proxy.ts`; alignment tested
  against `PROXY_MATCHER` from `@scibly/observability/proxy/matcher`.

## Domain vocabulary (`CONTEXT.md`)

- A feature folder's `CONTEXT.md` is binding on **identifiers**, not just prose:
  module, file, type, function, and constant names must use its terms, and must
  not use anything on an `_Avoid_` list. Diff the names in a feature against its
  `CONTEXT.md` before reviewing anything else about naming — drift there is a
  maintainability finding with a citable source, not a matter of taste.
- When a refactor names a concept the `CONTEXT.md` does not have, add the term
  there in the same change (create the file lazily if the feature has none).

## Third-party HTTP responses

- Any JSON coming back from a provider or external API is parsed with a Zod
  schema before use — never `as T`, never an interface asserted over
  `response.json()`. The repo idiom is
  `someSchema.parse(await response.json())` (see
  `apps/app/src/features/organizations/settings/server/endpoint-probe.ts`).
- A `// SAFETY:` comment claiming the shape is documented, or that callers check
  the fields, is not a substitute for a parse — it is a finding in its own
  right, because nothing keeps the comment true.
- A shared request helper takes the schema as a parameter rather than a type
  argument, so parsing cannot be forgotten at a call site.

## Misc conventions

- Zod is v4 (pinned via pnpm override) — flag v3-only idioms.
- IDs: `nanoid`/`uuid` per existing usage in the touched domain — match it.
- Dates: `date-fns` (no new date libs). Styling: Tailwind +
  `class-variance-authority`; components compose `packages/ui` Radix wrappers
  rather than re-wrapping Radix directly.
- Env access goes through the typed env (`@t3-oss/env-nextjs`, `apps/app/env.js`)
  — raw `process.env` reads in app code are findings.
- URLs are built by `@scibly/routes`, never string-concatenated or
  template-literalled at the call site. The package already loads the base URLs
  through `loadPackageEnv`, so routing a URL through it usually removes a raw
  `process.env` read as well. A URL assembled inline — especially one an
  external service will redirect to — is a finding.
- A registry keyed by a known id union must be exhaustive over it:
  `satisfies Record<SomeId, Config>`, so adding a member fails to compile until
  every registry is updated. `Map<string, Config>` plus a default entry is a
  finding — it turns a missing case into a silent wrong-looking UI, and parallel
  registries drift apart without anything failing.
- **Optional methods on a base class are how a capability seam rots.** When
  only some implementations of a provider/adapter base support a capability,
  the repo's pattern is a narrowed subclass plus a narrowed resolver, not
  `someMethod?()` on the base — see `PageIntegrationProvider` /
  `getPageProvider` / `resolvePageConnection` in
  `apps/app/src/features/integrations/`, which declare the page methods
  `abstract` and non-optional so no call site needs `?.` or a fallback. Optional
  methods push the capability check to every call site as `await p.m?.(x) ?? F`,
  and the fallback `F` is unreachable in practice, so it is never exercised and
  drifts into being wrong — in one live case the "empty" fallback made a
  downstream `listedEverything` check compute as `true`, inverting the intent of
  the very fallback it came from. Treat an optional method with more than one
  call site as a finding, and check what each fallback value does downstream
  rather than assuming a dead branch is a harmless one.

## Refactor plan and execution requirements

When writing or executing refactor steps:

1. Splitting a monolith file **must** list each new file path, export name, and
   which components move out.
2. Lint/type errors **must** be fixed properly — never "add eslint-disable" or
   "prefix with \_".
3. Verification **must** include `pnpm check` with zero new suppressions in
   touched files (grep for `eslint-disable|@ts-ignore|@ts-expect-error`
   before/after).
4. Treat clusters of suppressions or `createElement` in UI components as a
   single **high** maintainability finding with a concrete file-split plan.

Example refactor step (fictional paths):

```markdown
### Step 2: Split order-summary-view into single-component files

- **Files:** `order-summary-view.tsx` → `order-summary-view.tsx`, `order-summary-skeleton.tsx`, `order-summary-empty.tsx`
- **Now:** `order-summary-view.tsx:12-48` defines `OrderSummaryView`, `orderSummarySkeleton`, and `OrderSummaryEmpty`; skeleton rendered via `createElement(orderSummarySkeleton)`.
- **Target:** Move skeleton and empty state into own files; export `OrderSummarySkeleton` and `OrderSummaryEmpty`; parent uses `<OrderSummarySkeleton />` JSX.
- **Risk:** Import paths in tests if any.
- **Verify:** `pnpm check`; grep touched files for `createElement|eslint-disable|@ts-ignore` — nothing new.
```
