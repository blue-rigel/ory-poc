import { NextRequest, NextResponse } from "next/server";

import { signIn } from "@/auth";
import { PORTAL_ORIGIN, safeReturnPath } from "@/lib/auth-urls";

const NONCE_PATTERN = /^[0-9a-f-]{36}$/i;

export async function GET(request: NextRequest) {
  const returnTo = safeReturnPath(request.nextUrl.searchParams.get("return_to"));
  const nonce = request.nextUrl.searchParams.get("nonce");

  if (!nonce || !NONCE_PATTERN.test(nonce)) {
    return NextResponse.redirect(new URL("/?authError=invalid_attempt", PORTAL_ORIGIN));
  }

  const popup = request.nextUrl.searchParams.get("popup") === "1";
  const destination = popup
    ? `/auth/popup-complete?nonce=${encodeURIComponent(nonce)}&return_to=${encodeURIComponent(returnTo)}`
    : returnTo;

  await signIn("ory", { redirectTo: destination });
}
