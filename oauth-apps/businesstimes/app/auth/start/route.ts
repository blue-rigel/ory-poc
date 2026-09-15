import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { signIn } from "../../../auth";

const NONCE_COOKIE = "bt-login-nonce";
const NONCE_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest) {
  const nonce = request.nextUrl.searchParams.get("nonce");
  if (!nonce || !NONCE_PATTERN.test(nonce)) {
    return new Response("Invalid login attempt", { status: 400, headers: { "Cache-Control": "no-store" } });
  }

  const cookieStore = await cookies();
  cookieStore.set(NONCE_COOKIE, nonce, {
    httpOnly: true,
    maxAge: 180,
    path: "/auth",
    sameSite: "lax",
    secure: request.nextUrl.protocol === "https:",
  });

  await signIn("ory", { redirectTo: `/auth/complete?nonce=${encodeURIComponent(nonce)}` });
}
