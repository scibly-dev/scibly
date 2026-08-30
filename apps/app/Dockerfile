# ── Build stage ───────────────────────────────────────────────────────────────
# The whole monorepo is copied in: the workspace is too interlinked (i18n merge,
# generated editor schema, ee/ transpiled packages) to prune before the build.
# The pruning is Next's file tracing instead — see `output: "standalone"` in
# next.config.js, which the production stage below copies out on its own.
FROM node:24-alpine AS builder

RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

WORKDIR /app
COPY . .

RUN pnpm install --frozen-lockfile --filter "@scibly/app..." --ignore-scripts

# NEXT_PUBLIC_* values are inlined into the client bundle at build time, not
# read again at runtime — override via `docker compose build --build-arg` (or
# the matching vars in the root .env, which docker compose forwards as build
# args) for a real domain.
ARG NEXT_PUBLIC_BASE_URL=http://localhost:3001
ARG NEXT_PUBLIC_APP_URL=http://localhost:3001
ARG NEXT_PUBLIC_WEB_URL=http://localhost:3000
ARG NEXT_PUBLIC_COLLAB_WS_URL=ws://localhost:4000
ARG NEXT_PUBLIC_DOCS_URL=http://localhost:3000/docs
ARG NEXT_PUBLIC_ENV=production
ARG NEXT_PUBLIC_PYTHON_BACKEND_BASE_URL=
ENV NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL \
    NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL \
    NEXT_PUBLIC_WEB_URL=$NEXT_PUBLIC_WEB_URL \
    NEXT_PUBLIC_COLLAB_WS_URL=$NEXT_PUBLIC_COLLAB_WS_URL \
    NEXT_PUBLIC_DOCS_URL=$NEXT_PUBLIC_DOCS_URL \
    NEXT_PUBLIC_ENV=$NEXT_PUBLIC_ENV \
    NEXT_PUBLIC_PYTHON_BACKEND_BASE_URL=$NEXT_PUBLIC_PYTHON_BACKEND_BASE_URL

# DATABASE_URL is only required by env.js's schema and never connected to
# during build; SKIP_ENV_VALIDATION lets the third-party credentials (AWS,
# Stripe, Notion, ...) stay unset — see docs/setup.md's "Optional integrations".
# The real DATABASE_URL is supplied at container runtime by docker-compose.
ENV DATABASE_URL="postgresql://localhost/build" \
    SKIP_ENV_VALIDATION=true

RUN pnpm --filter @scibly/app run i18n:merge \
    && pnpm --filter @scibly/app run schema:generate \
    && pnpm --filter @scibly/db run generate \
    && pnpm --filter @scibly/app run build

# ── Production stage ──────────────────────────────────────────────────────────
FROM node:24-alpine AS runner

WORKDIR /app

# The standalone bundle carries its own server and its own node_modules, so
# nothing is installed here. It leaves out `public` and `.next/static`, which
# it serves once they are put back beside it.
COPY --from=builder /app/apps/app/.next/standalone ./
COPY --from=builder /app/apps/app/.next/static ./apps/app/.next/static
COPY --from=builder /app/apps/app/public ./apps/app/public

ENV NODE_ENV=production \
    PORT=3001 \
    HOSTNAME=0.0.0.0

# Carried over from the build stage, where they used to persist into the single
# image: env.js runs at startup too, and docker-compose supplies the real
# DATABASE_URL.
ENV DATABASE_URL="postgresql://localhost/build" \
    SKIP_ENV_VALIDATION=true

EXPOSE 3001
CMD ["node", "apps/app/server.js"]
