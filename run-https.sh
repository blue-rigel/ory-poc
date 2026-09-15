#!/usr/bin/env bash
set -euo pipefail

if [[ -f .env.oauth.local ]]; then
  set -a
  source .env.oauth.local
  set +a
fi

: "${ORY_ISSUER:=https://cranky-bose-9s8hbv5let.projects.oryapis.com}"

cleanup() {
  local pid
  for pid in "${HTTPS_PROXY_PID:-}" "${ST_APP_PID:-}" "${BT_APP_PID:-}" "${ORY_APP_PID:-}" "${ORY_TUNNEL_PID:-}"; do
    if [[ -n "$pid" ]]; then
      sudo kill "$pid" 2>/dev/null || kill "$pid" 2>/dev/null || true
      wait "$pid" 2>/dev/null || true
    fi
  done
}

trap cleanup EXIT INT TERM

ORY_APP_URL=https://orypoc.test ./ory.sh &
ORY_TUNNEL_PID=$!

CERT_DIR=.cert
CERT_FILE="$CERT_DIR/oauth-apps.test.pem"
KEY_FILE="$CERT_DIR/oauth-apps.test-key.pem"
DOMAINS=(orypoc.test straitstimes.test businesstimes.test)

mkdir -p "$CERT_DIR"

if [[ ! -f "$CERT_FILE" || ! -f "$KEY_FILE" ]] || \
  ! openssl x509 -in "$CERT_FILE" -noout -ext subjectAltName 2>/dev/null | grep -q 'DNS:businesstimes.test'; then
  if ! command -v mkcert >/dev/null 2>&1; then
    printf 'mkcert is required. Install it with: brew install mkcert\n' >&2
    exit 1
  fi
  mkcert -cert-file "$CERT_FILE" -key-file "$KEY_FILE" "${DOMAINS[@]}"
fi

"$(command -v pnpm)" dev:local &
ORY_APP_PID=$!

AUTH_SECRET="${ST_AUTH_SECRET:-}" \
ORY_ISSUER="$ORY_ISSUER" \
ORY_CLIENT_ID="${ST_ORY_CLIENT_ID:-}" \
ORY_CLIENT_SECRET="${ST_ORY_CLIENT_SECRET:-}" \
"$(command -v pnpm)" --filter @oauth-apps/straitstimes dev --hostname 127.0.0.1 --port 3001 &
ST_APP_PID=$!

AUTH_SECRET="${BT_AUTH_SECRET:-}" \
ORY_ISSUER="$ORY_ISSUER" \
ORY_CLIENT_ID="${BT_ORY_CLIENT_ID:-}" \
ORY_CLIENT_SECRET="${BT_ORY_CLIENT_SECRET:-}" \
"$(command -v pnpm)" --filter @oauth-apps/businesstimes dev --hostname 127.0.0.1 --port 3002 &
BT_APP_PID=$!

sudo env \
  "PATH=$PATH" \
  "HTTPS_CERT=$CERT_FILE" \
  "HTTPS_KEY=$KEY_FILE" \
  "$(command -v node)" scripts/https-proxy.mjs &
HTTPS_PROXY_PID=$!

printf '\nLocal apps are starting:\n'
printf '  https://orypoc.test\n'
printf '  https://straitstimes.test\n'
printf '  https://businesstimes.test\n\n'

wait "$HTTPS_PROXY_PID"
