# Architecture

Three deployables, one Postgres database, a background-work engine, a layer
of shared packages — pnpm + Turborepo monorepo.

```mermaid
flowchart TB
    App["apps/app\nthe product (:3001)"]
    Web["apps/web\nmarketing site (:3000)"]
    Collab["apps/collab\nrealtime editor sync (:4000)"]
    Inngest["inngest\nbackground work (:8288)"]
    Shared["packages/\ndb, auth, api, ui, ..."]
    EE["ee/\nStripe billing (separately licensed)"]
    DB[(PostgreSQL)]

    App --> Shared
    Web --> Shared
    Collab --> Shared
    Shared --> DB
    Shared -. plugs in .-> EE
    App -. "Yjs over WebSocket" .-> Collab
    Inngest -- "invokes /api/inngest" --> App
    Inngest --> DB
```

- **`apps/app`** — the product: notebook (AI drafts a course from an
  author's sources), course authoring, learning/player, organizations, auth.
  See [apps/app/src/ARCHITECTURE.md](../apps/app/src/ARCHITECTURE.md) for how
  its code is organized internally.
- **`apps/web`** — the public marketing site (landing, blog, legal). Shares
  auth and billing with `apps/app`.
- **`apps/collab`** — a standalone Hocuspocus/Yjs server for realtime course
  editing, deployed separately from the two Next.js apps.
- **`inngest`** — the self-hosted background-work engine: schedules, retries,
  and records every function that outlives a request. It isn't code in this
  repo, it's a container that calls `apps/app` back over HTTP; the functions
  live in `apps/app/src/lib/inngest/`. See
  [ADR 0004](adr/0004-inngest-self-hosted-orchestration.md).
- **`packages/`** — shared code: `db` (Prisma/Postgres schema, the source of
  truth), `auth` (better-auth), `api` (tRPC + entitlement), plus `ui`,
  `i18n`, `email`, `observability`, and lower-level helpers.
- **`ee/`** — the one cloud-specific piece (Stripe billing), separately
  licensed — see [ee/README.md](../ee/README.md).

For the product's domain concepts (Organizations, Notebook, Course
authoring, Learning, ...) see [CONTEXT-MAP.md](../CONTEXT-MAP.md). Notable
design decisions are recorded in [docs/adr/](adr/).
