#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [ ! -d "$ROOT_DIR/node_modules" ]; then
  echo "Dependencies not installed. Please run: npm install"
  exit 1
fi

if command -v lsof >/dev/null 2>&1 && lsof -tiTCP:3133 -sTCP:LISTEN >/dev/null 2>&1; then
  echo "Port 3133 is already in use. Please stop the running service first."
  exit 1
fi

mkdir -p "$ROOT_DIR/data"

echo "Building frontend..."
npm run build

echo
echo "Starting integrated app on http://127.0.0.1:3133"
echo "Default login: admin / admin"
echo "Press Ctrl+C to stop."
echo

HOST=127.0.0.1 PORT=3133 npm start
