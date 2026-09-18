import { Configuration, FrontendApi } from "@ory/client";
import { NextRequest, NextResponse } from "next/server";

import { ORY_ISSUER } from "@/auth";
import { PORTAL_ORIGIN } from "@/lib/auth-urls";

function safeProviderLogout(value: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    const issuer = new URL(ORY_ISSUER);
    if (url.origin !== issuer.origin || url.pathname !== "/oauth2/sessions/logout") return null;
    return url;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const providerLogout = safeProviderLogout(request.nextUrl.searchParams.get("return_to"));
  if (!providerLogout) return NextResponse.redirect(new URL("/", PORTAL_ORIGIN));

  try {
    const frontend = new FrontendApi(new Configuration({ basePath: ORY_ISSUER }));
    const cookie = request.headers.get("cookie") ?? "";
    await frontend.toSession({ cookie });
    const { data } = await frontend.createBrowserLogoutFlow({
      cookie,
      returnTo: providerLogout.toString(),
    });
    const logoutUrl = new URL(data.logout_url);
    if (logoutUrl.origin !== new URL(ORY_ISSUER).origin) throw new Error("Unexpected logout origin");

    const logoutResponse = await fetch(logoutUrl, {
      headers: { cookie },
      redirect: "manual",
      cache: "no-store",
    });
    const location = logoutResponse.headers.get("location");
    const destination = location ? new URL(location, ORY_ISSUER) : providerLogout;
    const response = NextResponse.redirect(destination);
    for (const sessionCookie of request.cookies.getAll().filter(({ name }) => name.startsWith("ory_session_"))) {
      response.cookies.set(sessionCookie.name, "", {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: 0,
      });
    }
    return response;
  } catch {
    // Continue OIDC logout when no active identity session exists.
    return NextResponse.redirect(providerLogout);
  }
}
