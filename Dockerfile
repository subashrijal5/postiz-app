# ---- Builder: full toolchain + all deps, builds the apps ----
FROM node:22.20-bookworm-slim AS builder
ARG NEXT_PUBLIC_VERSION
ENV NEXT_PUBLIC_VERSION=$NEXT_PUBLIC_VERSION

RUN apt-get update && apt-get install -y --no-install-recommends \
    g++ \
    make \
    python3-pip \
    bash \
 && rm -rf /var/lib/apt/lists/*

RUN npm --no-update-notifier --no-fund --global install pnpm@10.6.1

WORKDIR /app

# .dockerignore excludes node_modules/.git/heavy artifacts, so this is safe
COPY . .

# Install everything (incl. devDeps needed to build) then build
RUN pnpm install
RUN NODE_OPTIONS="--max-old-space-size=4096" pnpm run build

# Drop devDependencies so they are not shipped in the runtime image
RUN pnpm prune --prod

# ---- Runtime: minimal, production-only ----
FROM node:22.20-bookworm-slim AS runtime
ARG NEXT_PUBLIC_VERSION
ENV NEXT_PUBLIC_VERSION=$NEXT_PUBLIC_VERSION

RUN apt-get update && apt-get install -y --no-install-recommends \
    nginx \
 && rm -rf /var/lib/apt/lists/*

RUN npm --no-update-notifier --no-fund --global install pnpm@10.6.1 pm2

RUN addgroup --system www \
 && adduser --system --ingroup www --home /www --shell /usr/sbin/nologin www \
 && mkdir -p /www \
 && chown -R www:www /www /var/lib/nginx

WORKDIR /app

# Bring over the built app + pruned production node_modules from the builder
COPY --from=builder /app /app

COPY var/docker/nginx.conf /etc/nginx/nginx.conf

CMD ["sh", "-c", "nginx && pnpm run pm2"]
