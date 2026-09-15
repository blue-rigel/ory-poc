import { NextRequest } from "next/server";
import { auth, issuer, signOut } from "../../../auth";

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
  Pragma: "no-cache",
};

export async function GET(request: NextRequest) {
  const requestIssuer = request.nextUrl.searchParams.get("iss");
  const requestSid = request.nextUrl.searchParams.get("sid");
  const session = await auth();

  if (
    !requestIssuer ||
    !requestSid ||
    requestIssuer !== issuer ||
    session?.oidc?.issuer !== issuer ||
    session.oidc.sid !== requestSid
  ) {
    return new Response(null, { status: 400, headers: NO_CACHE_HEADERS });
  }

  await signOut({ redirect: false, redirectTo: "/" });
  return new Response(null, { status: 204, headers: NO_CACHE_HEADERS });
}
