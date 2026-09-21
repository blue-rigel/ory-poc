import { Configuration, FrontendApi, type LoginFlow } from "@ory/client";
import { isAxiosError } from "axios";
import { NextRequest, NextResponse } from "next/server";

import { ORY_ISSUER } from "@/auth";
import { assertOryRedirect, PORTAL_ORIGIN } from "@/lib/auth-urls";
import { openLoginTicket, sealLoginTicket, type LoginTicket } from "@/lib/login-ticket";
import { oryOAuthAdmin } from "@/lib/ory-admin";

const REMEMBER_FOR_SECONDS = 72 * 60 * 60;
const CHALLENGE_COOKIE = "ory_oauth_login_challenge";
const HANDOFF_COOKIE = "ory_oauth_login_handoff";
const frontend = new FrontendApi(new Configuration({ basePath: ORY_ISSUER }));

function redirectToForm(ticket: LoginTicket, stage: "identifier" | "password", error?: string) {
  const url = new URL("/auth/identity-login", ticket.clientOrigin);
  url.searchParams.set("ticket", sealLoginTicket({ ...ticket, expiresAt: Date.now() + 5 * 60_000 }));
  url.searchParams.set("stage", stage);
  for (const provider of ticket.socialProviders ?? []) {
    url.searchParams.append("provider", provider);
  }
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

function browserRedirect(error: unknown) {
  if (!isAxiosError(error)) return;
  const data = error.response?.data as {
    error?: { id?: unknown };
    redirect_browser_to?: unknown;
  } | undefined;
  if (data?.error?.id !== "browser_location_change_required") return;
  const value = data.redirect_browser_to;
  if (typeof value !== "string") return;

  const redirect = new URL(value);
  const issuerOrigin = new URL(ORY_ISSUER).origin;
  const allowedOrigins = new Set([issuerOrigin, PORTAL_ORIGIN, "https://accounts.google.com"]);
  if (!allowedOrigins.has(redirect.origin)) return;
  if (redirect.origin === issuerOrigin) {
    return new URL(`${redirect.pathname}${redirect.search}${redirect.hash}`, PORTAL_ORIGIN);
  }
  return redirect;
}

function setCookiePair(response: NextResponse, pair: string) {
  const separator = pair.indexOf("=");
  if (separator < 1) return;
  response.cookies.set(pair.slice(0, separator), pair.slice(separator + 1), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
  });
}

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const ticketValue = form.get("ticket");
  if (typeof ticketValue !== "string") return new Response("Invalid login request", { status: 400 });

  try {
    const ticket = openLoginTicket(ticketValue);
    const identifier = form.get("identifier");
    const password = form.get("password");
    const provider = form.get("provider");
    const stage = form.get("stage");

    if (typeof provider === "string") {
      const { data: flow } = await frontend.getLoginFlow({
        id: ticket.flowId,
        cookie: ticket.csrfCookie,
      });
      const availableProviders = flow.ui.nodes.flatMap(({ attributes, group }) =>
        group === "oidc" &&
        attributes.node_type === "input" &&
        attributes.name === "provider" &&
        typeof attributes.value === "string"
          ? [attributes.value]
          : []
      );
      const resolvedProvider = availableProviders.find((available) =>
        available === provider ||
        (provider === "google" && available.toLowerCase().startsWith("google-"))
      );
      if (!resolvedProvider) {
        return redirectToForm(ticket, "identifier", "This social login provider is unavailable.");
      }

      try {
        await frontend.updateLoginFlow({
          flow: ticket.flowId,
          cookie: ticket.csrfCookie,
          updateLoginFlowBody: {
            csrf_token: ticket.csrfToken,
            method: "oidc",
            provider: resolvedProvider,
          },
        });
      } catch (error) {
        if (!isAxiosError(error)) throw error;
        const redirect = browserRedirect(error);
        if (!redirect) throw error;

        const response = NextResponse.redirect(redirect, 303);
        setCookiePair(response, ticket.csrfCookie);
        for (const header of error.response?.headers["set-cookie"] ?? []) {
          setCookiePair(response, header.split(";", 1)[0]);
        }
        response.cookies.set(CHALLENGE_COOKIE, ticket.challenge, {
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

      throw new Error("Ory did not start social login.");
    }

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
