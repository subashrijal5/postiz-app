# ---- base: full install + Prisma client, shared by every build stage ----
# NOTE: this repo's .npmrc sets node-linker=hoisted, which computes one flat
# node_modules across the whole workspace regardless of `pnpm install --filter`
# scoping - so there's no cheap way to give backend/orchestrator separate
# dependency trees here without a repo-wide node-linker change (out of scope,
# higher risk - see MIGRATION-MULTI-SERVICE.md). Backend and orchestrator
# therefore share one pruned node_modules; frontend still gets a fully
# isolated image for free via Next's standalone output tracing below.
FROM node:22.20-bookworm-slim AS base
ARG NEXT_PUBLIC_VERSION
ENV NEXT_PUBLIC_VERSION=$NEXT_PUBLIC_VERSION

RUN apt-get update && apt-get install -y --no-install-recommends \
    g++ \
    make \
    python3-pip \
    ca-certificates \
  && rm -rf /var/lib/apt/lists/*

RUN npm --no-update-notifier --no-fund --global install pnpm@10.6.1

WORKDIR /app

# .dockerignore excludes node_modules/.git/dist/.next/heavy artifacts.
COPY . .

RUN pnpm install --frozen-lockfile

# ---- build-frontend ----
FROM base AS build-frontend
RUN NODE_OPTIONS="--max-old-space-size=4096" pnpm --filter ./apps/frontend run build
# Next's standalone output traces only what the frontend actually imports -
# the runtime-frontend image below needs nothing else from node_modules.
RUN cd apps/frontend \
  && cp -r .next/static .next/standalone/apps/frontend/.next/static \
  && cp -r public .next/standalone/apps/frontend/public

# ---- build-backend ----
FROM base AS build-backend
RUN NODE_OPTIONS="--max-old-space-size=4096" pnpm --filter ./apps/backend run build

# ---- build-orchestrator ----
FROM base AS build-orchestrator
RUN NODE_OPTIONS="--max-old-space-size=4096" pnpm --filter ./apps/orchestrator run build

# ---- deps-prod: shared node_modules with devDependencies dropped ----
FROM base AS deps-prod
RUN pnpm prune --prod

# ---- runtime-frontend: just the standalone Next server ----
FROM node:22.20-bookworm-slim AS runtime-frontend
ARG NEXT_PUBLIC_VERSION
ENV NEXT_PUBLIC_VERSION=$NEXT_PUBLIC_VERSION
ENV NODE_ENV=production
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=build-frontend /app/apps/frontend/.next/standalone ./
EXPOSE 4200
CMD ["node", "apps/frontend/server.js"]

# ---- runtime-backend: shared pruned deps + backend's compiled dist ----
FROM node:22.20-bookworm-slim AS runtime-backend
ENV NODE_ENV=production
# ca-certificates: outbound HTTPS to social provider APIs. openssl: Prisma's
# query-engine runtime probes `openssl version` to pick the right binary
# target - without it present, it silently guesses wrong and the engine
# fails to load at startup (found via local smoke-test, not from docs).
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates openssl \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=deps-prod /app /app
COPY --from=build-backend /app/apps/backend/dist /app/apps/backend/dist
EXPOSE 3000
CMD ["node", "--experimental-require-module", "apps/backend/dist/apps/backend/src/main.js"]

# ---- runtime-orchestrator: shared pruned deps + orchestrator's compiled dist ----
FROM node:22.20-bookworm-slim AS runtime-orchestrator
ENV NODE_ENV=production
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates openssl \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=deps-prod /app /app
COPY --from=build-orchestrator /app/apps/orchestrator/dist /app/apps/orchestrator/dist
CMD ["node", "--experimental-require-module", "apps/orchestrator/dist/apps/orchestrator/src/main.js"]
