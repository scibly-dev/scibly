# Docker self-hosting

The fastest way to run all of Scibly on your own infrastructure: one
`docker compose up` spins up Postgres, the Inngest background-work engine,
and all three apps. For running from source with pnpm instead (contributing,
debugging), see
[setup.md](setup.md); [architecture.md](architecture.md) has the map of
what each service is.

## 1. Configure

```bash
git clone <this-repo>
cd scibly-lms
cp .env.example .env
```

Open `.env` and set, at minimum:

- `COLLAB_TOKEN_SECRET` and `BETTER_AUTH_SECRET` — generate each with
  `openssl rand -base64 32`. `COLLAB_TOKEN_SECRET` signs the token each
  editor session uses to open a collab room; it must be identical for the
  `app` and `collab` containers, which sharing one `.env` guarantees.
- `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY` — generate each with
  `openssl rand -hex 32`. The signing key must be **bare hex with no
  `signkey-` prefix**: the server refuses to start on anything else, and the
  SDK carries a prefix through into the hash it signs with, so a prefix on
  one side alone means every call fails to verify. Compose refuses to start
  without both. They're the whole
  contract between the app and the Inngest server: the event key
  authenticates events the app sends, the signing key signs calls in both
  directions. Sharing one `.env` keeps the two sides in agreement.
- `POSTGRES_PASSWORD` — anything other than the default if this will be
  reachable from outside your machine.

Everything else in `.env` is either a sane default (ports, `NEXT_PUBLIC_*`
URLs for a local run) or an optional third-party integration — see
[Optional integrations](#optional-integrations) below.

## 2. Run

```bash
docker compose up -d --build
```

This builds three app images (`apps/app`, `apps/web`, `apps/collab`),
starts Postgres, runs `prisma migrate deploy` once via a one-shot `migrate`
service, starts the Inngest server, then starts every app:

- `apps/app` → http://localhost:3001 (the product)
- `apps/web` → http://localhost:3000 (marketing site)
- `apps/collab` → ws://localhost:4000 (realtime editor sync)
- `inngest` → http://localhost:8288 (background-work dashboard)

The Inngest server is where scheduled and background work actually runs —
see [ADR 0004](adr/0004-inngest-self-hosted-orchestration.md). It calls back
into `app` at `/api/inngest` to execute each step, and the dashboard is where
you watch a run and its retries. Publishing :8288 is convenient
rather than required — nothing else needs it, so drop the `ports:` mapping
if the host is exposed.

`docker compose logs -f` to follow all services, `docker compose down` to
stop them (add `-v` to also drop the Postgres volume and start clean).

## Deploying to a real domain

`NEXT_PUBLIC_*` values (`NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_WEB_URL`,
`NEXT_PUBLIC_COLLAB_WS_URL`, `NEXT_PUBLIC_DOCS_URL`) are inlined into the
client JavaScript bundle at **build** time, not read again once the
container is running. Set them to your real domains in `.env` before
building — `ws://` becomes `wss://` and `http://` becomes `https://` once
you're behind TLS — then:

```bash
docker compose build
docker compose up -d
```

Put a reverse proxy (Caddy, nginx, Traefik) in front for TLS termination
and routing; `apps/collab/docker-compose.yml` has a working Caddy example
for the collab service alone, if useful as a reference.

## Optional integrations

`SKIP_ENV_VALIDATION=true` (the default in `.env.example`) lets every
third-party credential below stay blank — the apps boot fine, only the
feature behind a missing one won't work. Fill in what you need, leave the
rest. Full detail on each is in [setup.md's Optional
integrations](setup.md#optional-integrations); the short version:

| Vars                                                     | Powers                                                     |
| -------------------------------------------------------- | ---------------------------------------------------------- |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`              | Google sign-in                                             |
| `RESEND_API_KEY`                                         | Transactional email                                        |
| `AWS_*`, `MEDIA_BUCKET_NAME`                             | Media uploads (notebook sources, images)                   |
| `NOTION_CLIENT_ID` / `NOTION_CLIENT_SECRET`              | Notion import                                              |
| `AI_GATEWAY_API_KEY`, `OPENAI_API_KEY`, `ENCRYPTION_KEY` | AI course generation, BYOAI key storage                    |
| `STRIPE_*`                                               | Billing (`ee/` only) — see [ee/README.md](../ee/README.md) |
| `NEXT_PUBLIC_POSTHOG_*`                                  | Product analytics                                          |

Once every credential your deployment needs is filled in, set
`SKIP_ENV_VALIDATION=false` and rebuild — validation errors on startup then
mean a var is missing rather than a feature silently not working.

## Database

Inngest keeps its config and run history in a separate `inngest` database on
the same Postgres server, created on every `up` by the one-shot `inngest-db`
service if it isn't there yet. A backup that dumps only `scibly` won't
contain it.

The `migrate` service runs `prisma migrate deploy` — safe to re-run,
applies only pending migrations. To seed demo data or open Prisma Studio
against the compose Postgres from your host machine:

```bash
DATABASE_URL="postgresql://scibly:scibly@localhost:5432/scibly" \
  pnpm --filter @scibly/db run seed
```

(swap in your `.env`'s `POSTGRES_*` values if you changed them from the
defaults; add a `ports:` mapping on the `postgres` service in
`docker-compose.yml` to reach it from the host, or run the command via
`docker compose exec`).

## Troubleshooting

- **App container exits immediately on first boot** — check `docker compose
logs migrate`; the app/web/collab containers wait on it succeeding, but a
  bad `POSTGRES_PASSWORD`/`DATABASE_URL` mismatch surfaces there first.
- **"COLLAB_TOKEN_SECRET must be at least 32 characters"** (from the
  `collab` container) — generate one with `openssl rand -base64 32` and set
  it in `.env`.
- **Changed a `NEXT_PUBLIC_*` var but the app still shows the old value** —
  those are build-time only; run `docker compose build` again.
- **"INNGEST_EVENT_KEY is required"** on `up` — both Inngest keys are
  mandatory; see step 1.
- **The Inngest dashboard is empty / functions never sync** — the server
  polls `http://app:3001/api/inngest` for the function list, so it has
  nothing to show until `app` is up. `docker compose logs inngest` shows the
  poll failing if it can't reach it. Repeated `403`s there mean the app and
  the server disagree about `INNGEST_SIGNING_KEY`.
