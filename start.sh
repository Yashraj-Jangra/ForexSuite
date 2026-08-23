#!/usr/bin/env bash
set -e

echo "=== VaultBill Dev Startup ==="

if ! docker info &>/dev/null; then
  echo "Docker not found. Install Docker Desktop or start services manually:"
  echo "  - Postgres on port 5434"
  echo "  - Redis on port 6380"
  echo "  - MinIO on port 9003"
  exit 1
fi

echo "Starting infrastructure (Postgres, Redis, Minio)..."
docker compose -f docker/compose.dev.yml up -d
echo "Infrastructure started."

echo "Starting dev servers (API on :3001, Web on :3000)..."
pnpm dev