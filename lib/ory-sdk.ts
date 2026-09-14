import { Configuration, FrontendApi } from "@ory/client";

export const ORY_SDK_URL = process.env.NEXT_PUBLIC_ORY_SDK_URL ?? "";

// Routed through the app's own origin so requests hit the @ory/nextjs
// middleware proxy (see middleware.ts) instead of the Ory Network domain
// directly — the session cookie is first-party and scoped to this app.
export const oryFrontend = new FrontendApi(
  new Configuration({
    basePath: typeof window === "undefined" ? ORY_SDK_URL : window.location.origin,
    baseOptions: {
      withCredentials: true,
    },
  }),
);

// Cookie-based session listing/revocation (GET/DELETE /sessions*) aren't in
// the @ory/nextjs middleware's proxy allowlist (only /sessions/whoami is), so
// the middleware falls through to Next.js routing instead of reaching Ory.
// This client uses the server-side proxy with credentials enabled so the
// browser's Ory session cookie reaches that route and gets forwarded upstream.
export const oryFrontendSessions = new FrontendApi(
  new Configuration({
    basePath: typeof window === "undefined" ? ORY_SDK_URL : `${window.location.origin}/api/ory-sessions`,
    baseOptions: {
      withCredentials: true,
    },
  }),
);
