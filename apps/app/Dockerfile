# Whole-monorepo image: simplest thing that reliably builds a workspace this
# interlinked (i18n merge, generated editor schema, ee/ transpiled packages).
# ponytail: no standalone-output/pruned node_modules, image is ~1-2GB heavier
# than it needs to be. Upgrade path: `output: "standalone"` in next.config.js
# once its file-tracing is verified against outputFileTracingIncludes.
FROM node:24-alpine

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

ENV NODE_ENV=production
EXPOSE 3001
CMD ["pnpm", "--filter", "@scibly/app", "run", "start"]
