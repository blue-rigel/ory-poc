import { FrontendApi, Configuration, type UiNodeInputAttributes } from "@ory/client";
import { isAxiosError } from "axios";
import { NextRequest, NextResponse } from "next/server";

import { ORY_ISSUER } from "@/auth";
import { assertOryRedirect, PORTAL_ORIGIN } from "@/lib/auth-urls";
import { sealLoginTicket, type LoginTicket } from "@/lib/login-ticket";
import { oryIdentityAdmin, oryOAuthAdmin } from "@/lib/ory-admin";

const CHALLENGE_PATTERN = /^[A-Za-z0-9._~+/=-]{16,8192}$/;
const REMEMBER_FOR_SECONDS = 72 * 60 * 60;
const CHALLENGE_COOKIE = "ory_oauth_login_challenge";
const HANDOFF_COOKIE = "ory_oauth_login_handoff";
const CLIENT_ORIGINS: Record<string, LoginTicket["clientOrigin"]> = {
  "1e544c88-30ba-4fae-b858-029f1124d8c9": PORTAL_ORIGIN,
  "c1d1b90a-9604-4038-b15f-7f38e316a640": "https://straitstimes.test",
  "6cf2b9d8-aa5c-408f-bff4-3132b5344936": "https://businesstimes.test",
};

function clearChallenge(response: NextResponse) {
  const expiredCookie = {
    httpOnly: true,
    secure: true,
    sameSite: "lax" as const,
    path: "/oauth2",
    maxAge: 0,
  };
  response.cookies.set(CHALLENGE_COOKIE, "", expiredCookie);
  response.cookies.set(HANDOFF_COOKIE, "", expiredCookie);
  return response;
}

async function continueWithKratos(
  challenge: string,
  clientId: string | undefined,
  aal2Required: boolean,
) {
  const clientOrigin = clientId ? CLIENT_ORIGINS[clientId] : undefined;
  if (!clientOrigin || aal2Required) return failure("unsupported_login_client");

  const frontend = new FrontendApi(new Configuration({ basePath: ORY_ISSUER }));
  const { data: flow, headers } = await frontend.createBrowserLoginFlow({
    returnTo: `${PORTAL_ORIGIN}/oauth2/login`,
  });
  const csrfCookie = (headers["set-cookie"] ?? [])
    .map((header) => header.split(";", 1)[0])
    .find((cookie) => cookie.startsWith("csrf_token_"));
  const csrfTokenNode = flow.ui.nodes.find((node) => {
    if (node.type !== "input") return false;
    return (node.attributes as UiNodeInputAttributes).name === "csrf_token";
  });
  const csrfAttributes = csrfTokenNode?.attributes as UiNodeInputAttributes | undefined;
  const csrfToken = typeof csrfAttributes?.value === "string"
    ? csrfAttributes.value
    : undefined;
  if (!csrfCookie || !csrfToken) return failure("login_flow_failed");

  const login = new URL("/auth/identity-login", clientOrigin);
  login.searchParams.set("stage", "identifier");
  login.searchParams.set("ticket", sealLoginTicket({
    challenge,
    clientOrigin,
    csrfCookie,
    csrfToken,
    expiresAt: Date.now() + 5 * 60_000,
    flowId: flow.id,
  }));

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
    let email: string | undefined;
    if (!loginRequest.skip) {
      const cookie = request.headers.get("cookie") ?? "";
      try {
        const frontend = new FrontendApi(new Configuration({ basePath: ORY_ISSUER }));
        const { data: session } = await frontend.toSession({ cookie });
        subject = session.identity?.id;
        const traits = session.identity?.traits as Record<string, unknown> | undefined;
        if (typeof traits?.email === "string") {
          email = traits.email;
        }
      } catch (error) {
        const errorId = isAxiosError(error)
          ? error.response?.data?.error?.id
          : undefined;
        const aal2Required = errorId === "session_aal2_required";

        if (request.cookies.has(HANDOFF_COOKIE)) {
          return clearChallenge(failure("session_handoff_failed"));
        }
        return continueWithKratos(challenge, loginRequest.client?.client_id, aal2Required);
      }
    } else if (subject) {
      const { data: identity } = await oryIdentityAdmin.getIdentity({ id: subject });
      const traits = identity.traits as Record<string, unknown> | undefined;
      if (typeof traits?.email === "string") email = traits.email;
    }

    if (!subject) return clearChallenge(failure("missing_subject"));
    const context = email ? { email } : {};

    const { data } = await oryOAuthAdmin.acceptOAuth2LoginRequest({
      loginChallenge: challenge,
      acceptOAuth2LoginRequest: loginRequest.skip
        ? { subject, context }
        : { subject, context, remember: true, remember_for: REMEMBER_FOR_SECONDS },
    });
    return clearChallenge(NextResponse.redirect(assertOryRedirect(data.redirect_to)));
  } catch {
    return clearChallenge(failure("challenge_failed"));
  }
}
