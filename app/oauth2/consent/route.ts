import { NextRequest, NextResponse } from "next/server";

import { assertOryRedirect, PORTAL_ORIGIN } from "@/lib/auth-urls";
import { oryOAuthAdmin } from "@/lib/ory-admin";

const CHALLENGE_PATTERN = /^[A-Za-z0-9._~+/=-]{16,8192}$/;
const REMEMBER_FOR_SECONDS = 72 * 60 * 60;

function failure(reason: string) {
  const url = new URL("/oauth2/error", PORTAL_ORIGIN);
  url.searchParams.set("reason", reason);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const challenge = request.nextUrl.searchParams.get("consent_challenge");
  if (!challenge || !CHALLENGE_PATTERN.test(challenge)) {
    return failure("invalid_consent_challenge");
  }

  try {
    const { data: consentRequest } =
      await oryOAuthAdmin.getOAuth2ConsentRequest({
        consentChallenge: challenge,
      });

    if (!consentRequest.client?.skip_consent) {
      return failure("consent_required");
    }

    const context = consentRequest.context as Record<string, unknown> | undefined;
    const email = typeof context?.email === "string" ? context.email : undefined;

    const { data } = await oryOAuthAdmin.acceptOAuth2ConsentRequest({
      consentChallenge: challenge,
      acceptOAuth2ConsentRequest: {
        grant_scope: consentRequest.requested_scope ?? [],
        grant_access_token_audience:
          consentRequest.requested_access_token_audience ?? [],
        session: {
          id_token: email ? { email, preferred_username: email } : {},
        },
        remember: true,
        remember_for: REMEMBER_FOR_SECONDS,
      },
    });

    return NextResponse.redirect(assertOryRedirect(data.redirect_to));
  } catch {
    return failure("consent_failed");
  }
}
