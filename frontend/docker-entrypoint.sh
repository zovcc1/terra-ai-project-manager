#!/bin/bash
set -e

# Check if node_modules already populated from the volume
if [ -d "/app/node_modules" ] && [ "$(ls -A /app/node_modules 2>/dev/null)" ]; then
    echo "[terra-frontend] Dependencies already installed — skipping bun install."
else
    echo "[terra-frontend] Installing dependencies..."
    bun install
fi

# Check if port 3000 is already in use (frontend already running)
if (echo >/dev/tcp/localhost/3000) 2>/dev/null; then
    echo "[terra-frontend] Port 3000 is already in use — frontend is already running."
    exit 0
fi

echo "[terra-frontend] Starting dev server..."
exec bun run dev -- --host 0.0.0.0
