import { FrontendApi, Configuration } from "@ory/client";
import { isAxiosError } from "axios";
import { NextRequest, NextResponse } from "next/server";

import { ORY_ISSUER } from "@/auth";
import { assertOryRedirect, PORTAL_ORIGIN } from "@/lib/auth-urls";
import { oryOAuthAdmin } from "@/lib/ory-admin";

const CHALLENGE_PATTERN = /^[A-Za-z0-9._~+/=-]{16,8192}$/;
const REMEMBER_FOR_SECONDS = 72 * 60 * 60;
const CHALLENGE_COOKIE = "ory_oauth_login_challenge";
const HANDOFF_COOKIE = "ory_oauth_login_handoff";

function clearChallenge(response: NextResponse) {
  response.cookies.delete(CHALLENGE_COOKIE);
  response.cookies.delete(HANDOFF_COOKIE);
  return response;
}

function continueWithKratos(
  challenge: string,
  aal2Required: boolean,
) {
  const login = new URL("/login", PORTAL_ORIGIN);
  login.searchParams.set("return_to", `${PORTAL_ORIGIN}/oauth2/login`);
  if (aal2Required) {
    login.searchParams.set("aal", "aal2");
    login.searchParams.set("refresh", "true");
  }

  const response = NextResponse.redirect(login);
  response.cookies.set(CHALLENGE_COOKIE, challenge, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/oauth2",
    maxAge: 10 * 60,
  });
  response.cookies.set(HANDOFF_COOKIE, "1", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/oauth2",
    maxAge: 10 * 60,
  });
  return response;
}

function failure(reason: string) {
  const url = new URL("/oauth2/error", PORTAL_ORIGIN);
  url.searchParams.set("reason", reason);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const challenge =
    request.nextUrl.searchParams.get("login_challenge") ??
    request.cookies.get(CHALLENGE_COOKIE)?.value;
  if (!challenge || !CHALLENGE_PATTERN.test(challenge)) {
    return clearChallenge(failure("invalid_challenge"));
  }

  try {
    const { data: loginRequest } = await oryOAuthAdmin.getOAuth2LoginRequest({
      loginChallenge: challenge,
    });

    let subject: string | undefined = loginRequest.subject;
    if (!loginRequest.skip) {
      const cookie = request.headers.get("cookie") ?? "";
      try {
        const frontend = new FrontendApi(new Configuration({ basePath: ORY_ISSUER }));
        const { data: session } = await frontend.toSession({ cookie });
        subject = session.identity?.id;
      } catch (error) {
        const errorId = isAxiosError(error)
          ? error.response?.data?.error?.id
          : undefined;
        const aal2Required = errorId === "session_aal2_required";

        if (request.cookies.has(HANDOFF_COOKIE)) {
          return clearChallenge(failure("session_handoff_failed"));
        }
        return continueWithKratos(challenge, aal2Required);
      }
    }

    if (!subject) return clearChallenge(failure("missing_subject"));

    const { data } = await oryOAuthAdmin.acceptOAuth2LoginRequest({
      loginChallenge: challenge,
      acceptOAuth2LoginRequest: loginRequest.skip
        ? { subject }
        : { subject, remember: true, remember_for: REMEMBER_FOR_SECONDS },
    });
    return clearChallenge(NextResponse.redirect(assertOryRedirect(data.redirect_to)));
  } catch {
    return clearChallenge(failure("challenge_failed"));
  }
}
