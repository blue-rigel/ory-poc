import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { signIn } from "../../../auth";

const ATTEMPT_COOKIE = "st-login-attempt";
const ATTEMPT_PATTERN = /^[a-f0-9]{48}$/;

export async function GET(request: NextRequest) {
  const attempt = request.nextUrl.searchParams.get("attempt");
  const popup = request.nextUrl.searchParams.get("popup") === "1";

  if (!attempt || !ATTEMPT_PATTERN.test(attempt)) {
    return Response.redirect(new URL("/?authError=invalid_attempt", request.url));
  }

  (await cookies()).set(ATTEMPT_COOKIE, attempt, {
    httpOnly: true,
    sameSite: "lax",
    secure: request.nextUrl.protocol === "https:",
    path: "/",
    maxAge: 5 * 60,
  });

  const completion = `/auth/complete?attempt=${attempt}${popup ? "&popup=1" : ""}`;
  await signIn("ory", { redirectTo: completion });
}
