# Setup guide

Get a local instance of Scibly running from source. See
[architecture.md](architecture.md) first if you want the map before the
steps, or [docker.md](docker.md) instead if you just want it running —
`docker compose up` covers Postgres and all three apps in one go.

## Prerequisites

| Tool       | Minimum                            | Recommended                                                                                                        |
| ---------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Node       | ≥22 ([`engines`](../package.json)) | 22 LTS — matches [CI](../.github/workflows/ci.yml); production images run 24                                       |
| pnpm       | —                                  | 10.33.0, exact — pinned in [package.json](../package.json)'s `packageManager` field; `corepack enable` picks it up |
| PostgreSQL | —                                  | any recent version — one database, shared by `apps/app`, `apps/web`, and `apps/collab`                             |

## 1. Install

```bash
git clone <this-repo>
cd scibly-lms
pnpm install
```

## 2. Environment variables

Each app/package that needs configuration ships a `.env.example` — copy it to
`.env` in the same directory and fill it in:

```bash
cp apps/app/.env.example apps/app/.env
cp apps/web/.env.example apps/web/.env
cp apps/collab/.env.example apps/collab/.env
cp packages/db/.env.example packages/db/.env
```

- `DATABASE_URL` in all four should point at the same database.
- `apps/app/.env`'s schema (`apps/app/src/env.js`) validates required
  variables at build/dev time. For a minimal local run without every
  third-party integration (AWS S3, Stripe, Notion, GitHub, PostHog, ...), set
  `SKIP_ENV_VALIDATION=true` and leave those blank — the app boots, but
  features that depend on a missing credential (media uploads, billing,
  Notion import, ...) won't work until it's supplied.
- `NOTION_CLIENT_ID` / `NOTION_CLIENT_SECRET` come from a Notion public
  integration. Its **capabilities** must include _Insert content_ and _Update
  content_, not only read — Knowledge writes each topic's document to a Notion
  page. The capabilities live on the integration, not in the authorize URL, so
  a workspace connected before they were enabled keeps working for reading and
  must reconnect before Knowledge can write.
- `GITHUB_APP_SLUG`, `GITHUB_APP_ID`, `GITHUB_APP_PRIVATE_KEY`,
  `GITHUB_APP_CLIENT_ID` and `GITHUB_APP_CLIENT_SECRET` are
  required by that schema, like Notion's credentials. They come from a GitHub
  App you register once per environment — see
  [runbooks/github-app.md](runbooks/github-app.md), which covers the dev and
  prod registrations and where each credential comes from.
- `COLLAB_TOKEN_SECRET` must be the **same value** in `apps/app/.env` and
  `apps/collab/.env` (min. 32 characters) — it signs the short-lived token
  each editor session uses to open a collab room. Generate one with
  `openssl rand -base64 32`. If you omit it from `apps/app/.env`,
  `BETTER_AUTH_SECRET` is used instead — see `scripts/dev.mjs`, which reads
  it from `apps/app/.env` and injects it into every `turbo run dev` process.
- `apps/web/.env` mounts the same better-auth handler as `apps/app`, so any
  Stripe vars you set (see [Optional integrations](#optional-integrations)
  below) need to be mirrored there too.
- `INNGEST_BASE_URL`, `INNGEST_EVENT_KEY`, and `INNGEST_SIGNING_KEY` are all
  required, and `apps/app/.env.example` ships values that work as-is against
  the local dev server `pnpm dev:inngest` starts (see step 4). Development runs
  Inngest in dev mode, where traffic is unsigned and the two keys are
  ignored; they matter once the app points at a real self-hosted server
  (`docker compose` does — see [docker.md](docker.md)), where they must match
  the values that server was started with. Generate each with
  `openssl rand -hex 32`. `INNGEST_DEV="false"` forces signed traffic from a
  dev session, for working against a real server locally.

## Optional integrations

None of these are required to run Scibly locally. Leave the vars blank (with
`SKIP_ENV_VALIDATION=true`, see above) and the app boots fine — only the
feature behind that integration won't work until you add credentials.

### AWS S3 — media storage

- **Powers:** notebook source uploads, generated images, and other media in
  `apps/app`.
- **Vars** (`apps/app/.env`): `AWS_REGION`, `AWS_ACCESS_KEY_ID`,
  `AWS_SECRET_ACCESS_KEY`, `MEDIA_BUCKET_NAME`.
- **Without it:** everything else works; upload/generate-media actions fail
  when you try to use them.

### Stripe — billing (`ee/` only)

- **Powers:** the billing screen, checkout, and subscription sync
  (`ee/billing`, `ee/organizations-billing`) — see
  [ee/README.md](../ee/README.md). You don't need a Stripe account to run
  the product; only the billing screen and checkout need it.
- **Vars** (`apps/app/.env`, price IDs mirrored into `apps/web/.env` — see
  above): `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
  `STRIPE_PRICE_STARTER`/`STRIPE_PRICE_BUSINESS`/`STRIPE_PRICE_PRO`,
  `STRIPE_PRICE_TOPUP_SMALL`/`STRIPE_PRICE_TOPUP_LARGE`,
  `STRIPE_PRICE_SEAT_STARTER`/`STRIPE_PRICE_SEAT_BUSINESS`/`STRIPE_PRICE_SEAT_PRO`,
  `STRIPE_PORTAL_CONFIGURATION_ID`.
- **Without it:** every organization stays on the free TRIAL plan; the
  product itself is fully usable, only upgrades/billing are unavailable.
- **Setup:** create the Starter/Business/Pro products and prices (plus the
  top-up and per-seat prices) in the Stripe Dashboard, forward webhooks
  locally with `stripe listen --forward-to localhost:3001/api/auth/stripe/webhook`,
  then run `npx tsx scripts/configure-stripe-portal.ts` from `ee/billing` —
  it prints the `STRIPE_PORTAL_CONFIGURATION_ID` to copy into both `.env`
  files (Stripe has no way to unset a default portal configuration, so this
  id pins which one the app uses).

### PostHog — product analytics

- **Powers:** nothing functional — usage analytics only.
- **Vars** (`apps/app/.env` and `apps/web/.env`):
  `NEXT_PUBLIC_POSTHOG_ENABLED`, `NEXT_PUBLIC_POSTHOG_KEY`,
  `NEXT_PUBLIC_POSTHOG_HOST`.
- **Without it:** already off by default (`NEXT_PUBLIC_POSTHOG_ENABLED`
  defaults to `false`) — nothing to configure unless you want analytics.

## 3. Database

```bash
pnpm --filter @scibly/db run migrate   # prisma migrate dev
pnpm --filter @scibly/db run seed      # optional: seed dev data
```

`pnpm --filter @scibly/db run studio` opens Prisma Studio against the same
database if you want to inspect data directly.

## 4. Run

```bash
pnpm dev
```

This runs `scripts/dev.mjs`, which resolves `COLLAB_TOKEN_SECRET` and starts
every app through Turborepo:

- `apps/app` → http://localhost:3001 (the product)
- `apps/web` → http://localhost:3000 (marketing site)
- `apps/collab` → ws://localhost:4000 (realtime editor sync)

To run a single app instead: `pnpm --filter @scibly/app run dev` (or
`@scibly/web`, `@scibly/collab`).

Background work needs a second terminal — nothing schedules or executes an
Inngest function without it:

```bash
pnpm dev:inngest
```

That's the Inngest dev server, dashboard on http://localhost:8288, pointed at
`apps/app`'s serve route (`/api/inngest`). It picks up whatever
`apps/app/src/server/inngest.ts` registers, re-syncing on its own as you edit.
Nothing waits for a cron to come round: the dashboard's event tester sends any
event by hand, so `scibly/integration-poll.requested` with a `connectionId`
runs one poll on the spot.

## Checks

```bash
pnpm check         # typecheck + lint + format check, every workspace
pnpm format:write  # auto-fix formatting
pnpm test:unit     # vitest, every workspace
pnpm test:e2e      # playwright, apps/app and apps/web
pnpm validate      # check + test:unit + test:e2e
```

## Troubleshooting

- **"Development requires COLLAB_TOKEN_SECRET..."** from `pnpm dev` — it
  couldn't find `COLLAB_TOKEN_SECRET` or `BETTER_AUTH_SECRET` in
  `apps/app/.env`, or the value is under 32 characters. Set one (see step 2).
- **Env validation fails on vars you don't have credentials for yet** — set
  `SKIP_ENV_VALIDATION=true` in `apps/app/.env` while you get the app
  running, then fill credentials in as you need the features behind them.
- **Background functions never run** — `pnpm dev` does not start the Inngest
  dev server; `pnpm dev:inngest` does, separately (see step 4). With it
  running, http://localhost:8288 lists them under Functions; if it
  doesn't, the app wasn't reachable at http://localhost:3001/api/inngest when
  the server polled it.
- **i18n or editor-schema errors on `dev`/`build`** — both `apps/app` and
  `apps/web` run `predev`/`prebuild` hooks (`pnpm i18n:merge`, and for
  `apps/app` also `pnpm schema:generate`) automatically; if you're invoking
  Next.js directly instead of through the package scripts, run those first.
