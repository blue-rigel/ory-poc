#!/usr/bin/env bash
set -euo pipefail

cleanup() {
  if [[ -n "${ORY_TUNNEL_PID:-}" ]]; then
    kill "$ORY_TUNNEL_PID" 2>/dev/null || true
    wait "$ORY_TUNNEL_PID" 2>/dev/null || true
  fi
}

trap cleanup EXIT INT TERM

ORY_APP_URL=https://orypoc.test ./ory.sh &
ORY_TUNNEL_PID=$!

sudo env "PATH=$PATH" "$(command -v pnpm)" dev:https
