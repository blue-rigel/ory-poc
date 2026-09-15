import { ORY_ISSUER } from "@/auth";

export const PORTAL_ORIGIN = "https://orypoc.test";

export function safeReturnPath(value: string | null, fallback = "/") {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return fallback;
  try {
    const url = new URL(value, PORTAL_ORIGIN);
    return url.origin === PORTAL_ORIGIN ? `${url.pathname}${url.search}${url.hash}` : fallback;
  } catch {
    return fallback;
  }
}

export function assertOryRedirect(value: string | undefined) {
  if (!value) throw new Error("Ory did not return a continuation URL.");
  const redirect = new URL(value);
  if (redirect.origin !== new URL(ORY_ISSUER).origin) {
    throw new Error("Ory returned an unexpected continuation origin.");
  }
  return redirect;
}
