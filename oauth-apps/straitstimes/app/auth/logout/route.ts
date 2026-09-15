import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { issuer, signOut } from "../../../auth";

const PUBLIC_ORIGIN = "https://straitstimes.test";

export async function POST(request: NextRequest) {
  const home = new URL("/", PUBLIC_ORIGIN);
  const mode = (await request.formData()).get("mode");
  if (mode !== "slo") {
    await signOut({ redirect: false });
    return Response.redirect(home, 303);
  }

  const secret = process.env.AUTH_SECRET;
  const token = secret
    ? await getToken({ req: request, secret, secureCookie: true })
    : null;
  const idToken = typeof token?.idToken === "string" ? token.idToken : undefined;
  await signOut({ redirect: false });

  if (!idToken) return Response.redirect(home, 303);

  try {
    const discovery = await fetch(`${issuer}/.well-known/openid-configuration`, { cache: "no-store" });
    const metadata = await discovery.json() as { end_session_endpoint?: string };
    if (metadata.end_session_endpoint) {
      const logout = new URL(metadata.end_session_endpoint);
      logout.searchParams.set("id_token_hint", idToken);
      logout.searchParams.set("post_logout_redirect_uri", home.href);
      return Response.redirect(logout, 303);
    }
  } catch {
    // Local logout has already completed; global logout is best effort.
  }

  return Response.redirect(home, 303);
}
