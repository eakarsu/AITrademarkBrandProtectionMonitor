#!/usr/bin/env bash
set -euo pipefail

project_dir="$(cd "$(dirname "$0")" && pwd)"
if [[ ! -f "$project_dir/.env" ]]; then
  echo "Missing $project_dir/.env; copy .env.example and provide real values." >&2
  exit 1
fi
BACKEND_PORT="${BACKEND_PORT:?BACKEND_PORT is required}"
FRONTEND_PORT="${FRONTEND_PORT:?FRONTEND_PORT is required}"
[[ -n "${DATABASE_URL:-}" ]] || { echo 'DATABASE_URL is required.' >&2; exit 1; }
JWT_SECRET_VALUE="${JWT_SECRET:-}"
[[ "${#JWT_SECRET_VALUE}" -ge 32 ]] || { echo 'JWT_SECRET must contain at least 32 characters.' >&2; exit 1; }
if [[ -z "${CORS_ORIGINS:-}" ]]; then
  if [[ "${NODE_ENV:-}" == test ]]; then export CORS_ORIGINS="http://127.0.0.1:$FRONTEND_PORT"; else echo 'CORS_ORIGINS is required.' >&2; exit 1; fi
fi
for dependency_dir in "$project_dir/backend/node_modules" "$project_dir/frontend/node_modules"; do
  if [[ ! -d "$dependency_dir" ]]; then
    echo "Missing $dependency_dir; install dependencies explicitly before starting." >&2
    exit 1
  fi
done

for port in "$BACKEND_PORT" "$FRONTEND_PORT"; do
  if lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then echo "Port $port is occupied; no process was terminated." >&2; exit 1; fi
done

(cd "$project_dir/backend" && BACKEND_PORT="$BACKEND_PORT" npm start) &
backend_pid=$!
(cd "$project_dir/frontend" && BACKEND_URL="http://127.0.0.1:$BACKEND_PORT" npm run dev -- --host "${FRONTEND_HOST:-127.0.0.1}" --port "$FRONTEND_PORT" --strictPort) &
frontend_pid=$!

cleanup() {
  trap - EXIT INT TERM
  kill "$backend_pid" "$frontend_pid" 2>/dev/null || true
  wait "$backend_pid" "$frontend_pid" 2>/dev/null || true
}
trap cleanup EXIT INT TERM
wait "$backend_pid" "$frontend_pid"
