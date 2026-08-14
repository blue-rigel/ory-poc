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

// Native (API-style) flows must never carry browser cookies, or Kratos
// rejects them as a CSRF mismatch ("flow was initiated as an API request").
// Kratos also rejects API flows that carry a browser "Origin" header, which
// every browser-issued fetch/XHR sends regardless of credentials mode or
// CORS config — so this client is routed through a Next.js Route Handler
// (app/api/ory-native/[...path]/route.ts) that calls Kratos server-to-server,
// where no Origin header is present.
export const oryFrontendNative = new FrontendApi(
  new Configuration({
    basePath: typeof window === "undefined" ? ORY_SDK_URL : `${window.location.origin}/api/ory-native`,
    baseOptions: {
      withCredentials: false,
    },
  }),
);

// Cookie-based session listing/revocation (GET/DELETE /sessions*) aren't in
// the @ory/nextjs middleware's proxy allowlist (only /sessions/whoami is), so
// the middleware falls through to Next.js routing instead of reaching Ory.
// This client reuses the same Route Handler as oryFrontendNative, but with
// credentials enabled so the browser's Ory session cookie reaches that route
// and gets forwarded upstream.
export const oryFrontendSessions = new FrontendApi(
  new Configuration({
    basePath: typeof window === "undefined" ? ORY_SDK_URL : `${window.location.origin}/api/ory-native`,
    baseOptions: {
      withCredentials: true,
    },
  }),
);
