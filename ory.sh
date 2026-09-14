#!/usr/bin/env bash

set -euo pipefail

readonly PROJECT_ID="${ORY_PROJECT_ID:-3d4fe10b-927f-4abb-bb19-14fe4fd82866}"
readonly WORKSPACE_ID="${ORY_WORKSPACE_ID:-efcc2a16-44b6-4199-95af-887d9a58f057}"
readonly PORT="${ORY_TUNNEL_PORT:-4000}"
readonly APP_URL="${ORY_APP_URL:-http://127.0.0.1:3000}"
readonly TUNNEL_URL="${ORY_TUNNEL_URL:-https://orypoc.test}"
readonly COOKIE_DOMAIN="${ORY_COOKIE_DOMAIN:-orypoc.test}"

if ! command -v ory >/dev/null 2>&1; then
  printf 'Error: Ory CLI is not installed or is not available in PATH.\n' >&2
  exit 127
fi

if [[ ! "$PORT" =~ ^[0-9]+$ ]] || ((PORT < 1 || PORT > 65535)); then
  printf 'Error: ORY_TUNNEL_PORT must be an integer from 1 to 65535.\n' >&2
  exit 2
fi

exec ory tunnel \
  --project "$PROJECT_ID" \
  --workspace "$WORKSPACE_ID" \
  --port "$PORT" \
  --cookie-domain "$COOKIE_DOMAIN" \
  "$APP_URL" \
  "$TUNNEL_URL"
