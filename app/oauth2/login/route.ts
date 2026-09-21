import { FrontendApi, Configuration } from "@ory/client";
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
const LOGIN_CLIENT_IDS = new Set([
  "1e544c88-30ba-4fae-b858-029f1124d8c9",
  "c1d1b90a-9604-4038-b15f-7f38e316a640",
  "6cf2b9d8-aa5c-408f-bff4-3132b5344936",
]);
const APP_LOGIN_ORIGINS = new Map<string, LoginTicket["clientOrigin"]>([
  ["c1d1b90a-9604-4038-b15f-7f38e316a640", "https://st-oauthapp.vercel.app"],
  ["6cf2b9d8-aa5c-408f-bff4-3132b5344936", "https://businesstimes.test"],
]);
const frontend = new FrontendApi(new Configuration({ basePath: ORY_ISSUER }));

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
  if (!clientId || !LOGIN_CLIENT_IDS.has(clientId) || aal2Required) {
    return failure("unsupported_login_client");
  }

  // Start the flow in the browser so Ory can set its CSRF/session cookies and
  // render the configured login UI, including OIDC social-provider buttons.
  const login = new URL("/self-service/login/browser", PORTAL_ORIGIN);
  login.searchParams.set("return_to", `${PORTAL_ORIGIN}/oauth2/login`);

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

async function continueWithAppLogin(
  challenge: string,
  clientOrigin: LoginTicket["clientOrigin"],
  cookie: string,
) {
  const login = await frontend.createBrowserLoginFlow({ cookie });
  const csrfNode = login.data.ui.nodes.find(({ attributes }) =>
    attributes.node_type === "input" && attributes.name === "csrf_token"
  );
  const csrfToken = csrfNode?.attributes.node_type === "input"
    ? csrfNode.attributes.value
    : undefined;
  const csrfCookie = (login.headers["set-cookie"] ?? [])
    .map((header) => header.split(";", 1)[0])
    .find((header) => header.startsWith("csrf_token_"));

  if (typeof csrfToken !== "string" || !csrfCookie) {
    throw new Error("Ory did not return login CSRF state.");
  }

  const url = new URL("/auth/identity-login", clientOrigin);
  url.searchParams.set("ticket", sealLoginTicket({
    challenge,
    clientOrigin,
    csrfCookie,
    csrfToken,
    expiresAt: Date.now() + 5 * 60_000,
    flowId: login.data.id,
  }));
  url.searchParams.set("stage", "identifier");
  return NextResponse.redirect(url);
}

function failure(reason: string) {
  const url = new URL("/oauth2/error", PORTAL_ORIGIN);
  url.searchParams.set("reason", reason);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const challengeCookie = request.cookies.get(CHALLENGE_COOKIE)?.value;
  const challenge = request.nextUrl.searchParams.get("login_challenge") ?? challengeCookie;
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

        if (request.cookies.has(HANDOFF_COOKIE) && challengeCookie === challenge) {
          return clearChallenge(failure("session_handoff_failed"));
        }
        const clientOrigin = loginRequest.client?.client_id
          ? APP_LOGIN_ORIGINS.get(loginRequest.client.client_id)
          : undefined;
        if (clientOrigin && !aal2Required) {
          return continueWithAppLogin(challenge, clientOrigin, cookie);
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
