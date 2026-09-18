import { NextRequest, NextResponse } from "next/server";

import { assertOryRedirect, PORTAL_ORIGIN } from "@/lib/auth-urls";
import { oryOAuthAdmin } from "@/lib/ory-admin";

const CHALLENGE_PATTERN = /^[A-Za-z0-9._~+/=-]{16,8192}$/;

export async function GET(request: NextRequest) {
  const challenge = request.nextUrl.searchParams.get("logout_challenge");
  if (!challenge || !CHALLENGE_PATTERN.test(challenge)) {
    return NextResponse.redirect(new URL("/", PORTAL_ORIGIN));
  }

  try {
    await oryOAuthAdmin.getOAuth2LogoutRequest({ logoutChallenge: challenge });
    const { data } = await oryOAuthAdmin.acceptOAuth2LogoutRequest({
      logoutChallenge: challenge,
    });
    return NextResponse.redirect(assertOryRedirect(data.redirect_to));
  } catch {
    const error = new URL("/oauth2/error", PORTAL_ORIGIN);
    error.searchParams.set("reason", "logout_failed");
    return NextResponse.redirect(error);
  }
}
