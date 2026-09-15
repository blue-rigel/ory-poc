import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { issuer, signOut } from "../../../auth";

export async function POST(request: NextRequest) {
  const secret = process.env.AUTH_SECRET;
  const token = secret
    ? await getToken({ req: request, secret, secureCookie: true })
    : null;
  const idToken = typeof token?.idToken === "string" ? token.idToken : undefined;
  let endSessionEndpoint: string | undefined;

  if (idToken) {
    try {
      const response = await fetch(`${issuer}/.well-known/openid-configuration`, { cache: "no-store" });
      if (response.ok) {
        const metadata = await response.json() as { end_session_endpoint?: unknown };
        if (typeof metadata.end_session_endpoint === "string") endSessionEndpoint = metadata.end_session_endpoint;
      }
    } catch {
      // Local logout still succeeds when provider discovery is unavailable.
    }
  }

  await signOut({ redirect: false, redirectTo: "/" });

  if (endSessionEndpoint && idToken) {
    const logoutUrl = new URL(endSessionEndpoint);
    logoutUrl.searchParams.set("id_token_hint", idToken);
    logoutUrl.searchParams.set("post_logout_redirect_uri", new URL("/", request.nextUrl.origin).toString());
    return NextResponse.redirect(logoutUrl, 303);
  }

  return NextResponse.redirect(new URL("/", request.nextUrl.origin), 303);
}
