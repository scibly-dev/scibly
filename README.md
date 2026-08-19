<p align="center">
  <img alt="Scibly" src="https://scibly-assets.s3.eu-central-1.amazonaws.com/logo-512x512.png" width="72" />
</p>

<h1 align="center">Scibly</h1>

<p align="center">
  Scibly is an open-source, AI-native learning platform.
</p>

<p align="center">
  <a href="#introduction"><strong>Introduction</strong></a> ·
  <a href="#tech-stack"><strong>Tech Stack</strong></a> ·
  <a href="#self-hosting"><strong>Self-hosting</strong></a> ·
  <a href="#contributing"><strong>Contributing</strong></a> ·
  <a href="#license"><strong>License</strong></a>
</p>

<p align="center">
  <a href="https://github.com/scibly-dev/scibly/actions/workflows/ci.yml">
    <img src="https://github.com/scibly-dev/scibly/actions/workflows/ci.yml/badge.svg" alt="CI" />
  </a>
</p>

## Introduction

Turn your existing knowledge into interactive learning experiences.
Scibly is an open-source, AI-native learning platform that transforms documents and internal knowledge into structured, interactive courses in minutes.

## Tech stack

- [Next.js](https://nextjs.org) – framework
- [TypeScript](https://www.typescriptlang.org) – language
- [Tailwind](https://tailwindcss.com) – CSS
- [Prisma](https://www.prisma.io) – ORM
- [PostgreSQL](https://www.postgresql.org) – database
- [better-auth](https://www.better-auth.com) – auth
- [tRPC](https://trpc.io) – API layer
- [Hocuspocus](https://tiptap.dev/docs/hocuspocus) / [Yjs](https://yjs.dev) – realtime editor sync
- [Turborepo](https://turbo.build/repo) – monorepo build orchestration
- [pnpm](https://pnpm.io) – package manager / workspaces
- [Stripe](https://stripe.com) – payments (`ee/` only)
- [Resend](https://resend.com) – transactional email
- [PostHog](https://posthog.com) – product analytics
- [AWS S3](https://aws.amazon.com/s3/) – media storage

## Self-hosting

You can self-host Scibly for full control over your data. pnpm workspaces +
Turborepo, three deployables and a shared package layer:

```text
apps/
├── app/      # the product — course authoring, learning, notebook (port 3001)
├── web/      # marketing site: landing, blog, pricing, legal (port 3000)
└── collab/   # realtime collaboration server for the course editor (port 4000)
packages/     # shared code: db, auth, api, ui, i18n, email, observability, …
ee/           # enterprise-only code, separately licensed — see ee/README.md
```

Fastest path — Docker:

```bash
cp .env.example .env   # fill in COLLAB_TOKEN_SECRET, BETTER_AUTH_SECRET
docker compose up -d --build
```

Spins up Postgres and all three apps in one go. Full walkthrough, including
deploying to a real domain and optional third-party integrations, is in
[docs/docker.md](docs/docker.md).

From source instead — Node ≥22, pnpm 10.33, a Postgres database:

```bash
pnpm install
# copy apps/app/.env.example, apps/web/.env.example, apps/collab/.env.example,
# and packages/db/.env.example to their .env counterparts and fill them in
pnpm --filter @scibly/db run migrate
pnpm dev
```

`pnpm dev` starts every app together (`apps/app` on :3001, `apps/web` on
:3000, `apps/collab` on :4000). Full walkthrough, including what each
environment variable is for and how to run a single app on its own, is in
[docs/setup.md](docs/setup.md).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to get set up and what to run
before opening a PR. Participation is governed by the
[Code of Conduct](CODE_OF_CONDUCT.md).

**Reference docs:**

- [Architecture](docs/architecture.md) — apps, packages, and how they fit together
- [Docker guide](docs/docker.md) — self-host with `docker compose up`
- [Setup guide](docs/setup.md) — full walkthrough, every environment variable, running a single app on its own
- [ee/](ee/) — the enterprise/commercial-only slice (billing) and why it's separate
- [CONTEXT-MAP.md](CONTEXT-MAP.md) — the product's domain contexts and how they relate
- [docs/adr/](docs/adr/) — architecture decision records

## License

Scibly is open core: everything outside `ee/` is licensed under
[AGPLv3](https://opensource.org/license/agpl-v3) — see [LICENSE](LICENSE).
The `ee/` directory (Stripe billing) is the enterprise slice: source-available,
but production use requires a separate license from Scibly — see
[ee/LICENSE](ee/LICENSE). Why that split, and not more: see
[ee/README.md](ee/README.md).
