import { Configuration, FrontendApi, type LoginFlow } from "@ory/client";
import { isAxiosError } from "axios";
import { NextRequest, NextResponse } from "next/server";

import { ORY_ISSUER } from "@/auth";
import { assertOryRedirect } from "@/lib/auth-urls";
import { openLoginTicket, sealLoginTicket, type LoginTicket } from "@/lib/login-ticket";
import { oryOAuthAdmin } from "@/lib/ory-admin";

const REMEMBER_FOR_SECONDS = 72 * 60 * 60;
const frontend = new FrontendApi(new Configuration({ basePath: ORY_ISSUER }));

function redirectToForm(ticket: LoginTicket, stage: "identifier" | "password", error?: string) {
  const url = new URL("/auth/identity-login", ticket.clientOrigin);
  url.searchParams.set("ticket", sealLoginTicket({ ...ticket, expiresAt: Date.now() + 5 * 60_000 }));
  url.searchParams.set("stage", stage);
  if (error) url.searchParams.set("error", error);
  return NextResponse.redirect(url, 303);
}

function flowFrom(error: unknown) {
  return isAxiosError(error) && error.response?.data?.ui
    ? error.response.data as LoginFlow
    : undefined;
}

function message(flow?: LoginFlow) {
  return flow?.ui.messages?.find(({ type }) => type === "error")?.text
    ?? flow?.ui.nodes.flatMap(({ messages }) => messages).find(({ type }) => type === "error")?.text;
}

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const ticketValue = form.get("ticket");
  if (typeof ticketValue !== "string") return new Response("Invalid login request", { status: 400 });

  try {
    const ticket = openLoginTicket(ticketValue);
    const identifier = form.get("identifier");
    const password = form.get("password");
    const stage = form.get("stage");

    if (stage === "identifier" && typeof identifier === "string" && identifier) {
      try {
        await frontend.updateLoginFlow({
          flow: ticket.flowId,
          cookie: ticket.csrfCookie,
          updateLoginFlowBody: {
            csrf_token: ticket.csrfToken,
            identifier,
            method: "identifier_first",
          },
        });
      } catch (error) {
        const flow = flowFrom(error);
        if (flow?.ui.nodes.some(({ group }) => group === "password")) {
          return redirectToForm({ ...ticket, identifier }, "password", message(flow));
        }
        throw error;
      }
    }

    if (stage !== "password" || typeof password !== "string" || !ticket.identifier) {
      return redirectToForm(ticket, "identifier", "Enter your email address.");
    }

    let login;
    try {
      login = await frontend.updateLoginFlow({
        flow: ticket.flowId,
        cookie: ticket.csrfCookie,
        updateLoginFlowBody: {
          identifier: ticket.identifier,
          csrf_token: ticket.csrfToken,
          method: "password",
          password,
        },
      });
    } catch (error) {
      const flow = flowFrom(error);
      if (flow) return redirectToForm(ticket, "password", message(flow) ?? "Login failed.");
      throw error;
    }

    const identity = login.data.session?.identity;
    if (!identity?.id) throw new Error("Ory did not create an identity session.");
    const traits = identity.traits as Record<string, unknown> | undefined;
    const context = typeof traits?.email === "string" ? { email: traits.email } : {};
    const { data } = await oryOAuthAdmin.acceptOAuth2LoginRequest({
      loginChallenge: ticket.challenge,
      acceptOAuth2LoginRequest: {
        subject: identity.id,
        context,
        remember: true,
        remember_for: REMEMBER_FOR_SECONDS,
      },
    });
    const response = NextResponse.redirect(assertOryRedirect(data.redirect_to), 303);
    for (const header of login.headers["set-cookie"] ?? []) {
      const [pair] = header.split(";");
      const separator = pair.indexOf("=");
      const name = pair.slice(0, separator);
      if (!name.startsWith("ory_session_") && !name.startsWith("csrf_token_")) continue;
      response.cookies.set(name, pair.slice(separator + 1), {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
      });
    }
    for (const name of ["ory_oauth_login_challenge", "ory_oauth_login_handoff"]) {
      response.cookies.set(name, "", {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/oauth2",
        maxAge: 0,
      });
    }
    return response;
  } catch {
    return new Response("The login request expired. Close this window and try again.", {
      status: 400,
      headers: { "Cache-Control": "no-store" },
    });
  }
}
