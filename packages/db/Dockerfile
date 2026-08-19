# One-shot migration runner: `docker compose up` runs this once against the
# real DATABASE_URL (see root docker-compose.yml) before app/web/collab start.
FROM node:24-alpine

RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

WORKDIR /app
COPY . .

RUN pnpm install --frozen-lockfile --filter "@scibly/db..." --ignore-scripts

# Not connected to during generate, only used to satisfy the config loader.
RUN DATABASE_URL="postgresql://localhost/build" pnpm --filter @scibly/db run generate

WORKDIR /app/packages/db
CMD ["pnpm", "run", "migrate:deploy"]
