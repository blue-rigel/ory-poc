#!/usr/bin/env bash
# Local Ory tunnel for native (API-style) flows: mirrors the Ory project's
# API at http://localhost:4000 so the browser talks same-origin/CORS-friendly
# instead of hitting projects.oryapis.com directly (see lib/ory-sdk.ts).
exec ory tunnel \
  --project 7ef85b02-9aba-473a-b5ee-34dc59fd7c5f \
  --workspace 046a0334-5ad8-4cae-b6f9-66102bc73693 \
  --port 4000 \
  http://localhost:3000
