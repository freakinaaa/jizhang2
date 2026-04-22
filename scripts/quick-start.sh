#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_PORT=4133
APP_HOST=127.0.0.1
APP_DATA_DIR="$ROOT_DIR/data-test"

cd "$ROOT_DIR"

if [ ! -d "$ROOT_DIR/node_modules" ]; then
  echo "Dependencies not installed. Please run: npm install"
  exit 1
fi

if command -v lsof >/dev/null 2>&1 && lsof -tiTCP:${APP_PORT} -sTCP:LISTEN >/dev/null 2>&1; then
  echo "Port ${APP_PORT} is already in use. Please stop the running service first."
  exit 1
fi

mkdir -p "$APP_DATA_DIR"

echo "Building frontend..."
npm run build

echo
echo "Starting integrated app on http://${APP_HOST}:${APP_PORT}"
echo "Default login: admin / admin"
echo "Test database: ${APP_DATA_DIR}/app.db"
echo "Press Ctrl+C to stop."
echo

HOST="$APP_HOST" PORT="$APP_PORT" DATA_DIR="$APP_DATA_DIR" npm start
