#!/usr/bin/env bash
set -e

cd /app

# Start nginx (serves static + proxies /api and / to the node processes)
nginx

echo "Applying database schema..."
pnpm run prisma-db-push

echo "Starting services..."
pm2 start /app/ecosystem.config.js

exec pm2 logs
