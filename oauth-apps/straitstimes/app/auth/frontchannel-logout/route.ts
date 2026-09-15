import { NextRequest } from "next/server";
import { auth, issuer, signOut } from "../../../auth";

const noStoreHeaders = {
  "Cache-Control": "no-store, max-age=0",
  Pragma: "no-cache",
};

export async function GET(request: NextRequest) {
  const session = await auth();
  const oidc = session?.oidc;
  const requestedIssuer = request.nextUrl.searchParams.get("iss");
  const requestedSid = request.nextUrl.searchParams.get("sid");

  if (
    !oidc?.sid ||
    !oidc.iss ||
    requestedIssuer !== issuer ||
    requestedIssuer !== oidc.iss ||
    requestedSid !== oidc.sid
  ) {
    return new Response("Invalid logout request", { status: 400, headers: noStoreHeaders });
  }

  await signOut({ redirect: false });
  return new Response(null, { status: 204, headers: noStoreHeaders });
}
