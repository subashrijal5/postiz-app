# ---- Builder: full toolchain + all deps, builds the apps ----
FROM node:22.20-bookworm-slim AS builder
ARG NEXT_PUBLIC_VERSION
ENV NEXT_PUBLIC_VERSION=$NEXT_PUBLIC_VERSION

RUN apt-get update && apt-get install -y --no-install-recommends \
    g++ \
    make \
    python3-pip \
    bash \
    ca-certificates \
  && rm -rf /var/lib/apt/lists/*

RUN npm --no-update-notifier --no-fund --global install pnpm@10.6.1

WORKDIR /app

# .dockerignore excludes node_modules/.git/heavy artifacts, so this is safe
COPY . .

# Install everything (incl. devDeps needed to build) then build
RUN pnpm install
RUN NODE_OPTIONS="--max-old-space-size=4096" pnpm run build

# Use Next.js standalone output for the frontend: drop the multi-GB full
# .next build and keep only the self-contained standalone server + static.
RUN cd /app/apps/frontend \
  && cp -r .next/static .next/standalone/apps/frontend/.next/static \
  && cp -r public .next/standalone/apps/frontend/public \
  && mv .next/standalone /tmp/standalone \
  && rm -rf .next \
  && mkdir -p .next \
  && mv /tmp/standalone .next/standalone

# Drop devDependencies so only prod deps ship in the runtime image.
# NOTE: we intentionally do NOT strip frontend packages (next/react/@mantine/...)
# from node_modules. The frontend runs from its Next.js standalone server, but
# that server still resolves react-dom/server and the UI libs via the repo
# node_modules walk-up at SSR time, so they must remain present.
RUN pnpm prune --prod

# ---- Runtime: minimal, production-only ----
FROM node:22.20-bookworm-slim AS runtime
ARG NEXT_PUBLIC_VERSION
ENV NEXT_PUBLIC_VERSION=$NEXT_PUBLIC_VERSION
ENV NODE_ENV=production

RUN apt-get update && apt-get install -y --no-install-recommends \
    nginx \
    ca-certificates \
  && rm -rf /var/lib/apt/lists/*

RUN npm --no-update-notifier --no-fund --global install pnpm@10.6.1 pm2

RUN addgroup --system www \
  && adduser --system --ingroup www --home /www --shell /usr/sbin/nologin www \
  && mkdir -p /www \
  && chown -R www:www /www /var/lib/nginx

WORKDIR /app

# Bring over the full (pruned) workspace: backend/orchestrator + node_modules
# with workspace libs, and the slimmed frontend standalone output.
COPY --from=builder /app /app

COPY var/docker/nginx.conf /etc/nginx/nginx.conf
COPY var/docker/ecosystem.config.js /app/ecosystem.config.js
COPY var/docker/entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

EXPOSE 5000
CMD ["/app/entrypoint.sh"]
