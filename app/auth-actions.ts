"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getToken } from "next-auth/jwt";

import { ORY_ISSUER, signOut } from "@/auth";
import { PORTAL_ORIGIN, safeReturnPath } from "@/lib/auth-urls";

export async function signOutHere() {
  await signOut({ redirectTo: "/" });
}

export async function signOutEverywhere() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is required for global logout.");
  const token = await getToken({
    req: { headers: await headers() },
    secret,
    secureCookie: true,
  });
  const idToken = typeof token?.oryIdToken === "string" ? token.oryIdToken : undefined;

  await signOut({ redirect: false });
  if (!idToken) redirect("/oauth2/error?reason=missing_id_token");

  const logout = new URL("/oauth2/sessions/logout", ORY_ISSUER);
  logout.searchParams.set("id_token_hint", idToken);
  logout.searchParams.set("post_logout_redirect_uri", `${PORTAL_ORIGIN}/`);
  redirect(logout.toString());
}

export async function localSignOutTo(value: string | null) {
  await signOut({ redirectTo: safeReturnPath(value) });
}
