# ── Build stage ───────────────────────────────────────────────────────────────
FROM node:24-alpine AS builder

RUN corepack enable && corepack prepare pnpm@10.33.0 --activate
RUN npm install -g esbuild

WORKDIR /app

COPY . .

RUN pnpm install --frozen-lockfile --filter "@scibly/collab..." --ignore-scripts

# DATABASE_URL is required by the config loader but not used during generate
RUN DATABASE_URL="postgresql://localhost/build" pnpm --filter @scibly/db run generate

RUN esbuild apps/collab/src/index.ts \
    --bundle \
    --platform=node \
    --target=node24 \
    --outfile=apps/collab/dist/index.js \
    --format=cjs \
    --define:import.meta.url='"file:///app/dist/index.js"' \
    --external:pg

# ── Production stage ──────────────────────────────────────────────────────────
FROM node:24-alpine AS runner

WORKDIR /app

RUN addgroup -g 1001 -S collab && adduser -S collab -u 1001

# pg is the only runtime dependency — everything else is in the bundle.
RUN printf '{"dependencies":{"pg":"^8"}}' > package.json \
    && npm install --omit=dev

COPY --from=builder /app/apps/collab/dist/index.js ./dist/index.js

RUN chown -R collab:collab /app

ENV NODE_ENV=production
ENV COLLAB_PORT=4000

EXPOSE 4000

USER collab

CMD ["node", "dist/index.js"]