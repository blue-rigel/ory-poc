import { NextRequest, NextResponse } from "next/server";

import { auth } from "../../../auth";

const ATTEMPT_COOKIE = "st-login-attempt";
const ATTEMPT_PATTERN = /^[a-f0-9]{48}$/;
const PUBLIC_ORIGIN = "https://straitstimes.test";

export async function GET(request: NextRequest) {
  const attempt = request.nextUrl.searchParams.get("attempt");
  const popup = request.nextUrl.searchParams.get("popup") === "1";
  const expectedAttempt = request.cookies.get(ATTEMPT_COOKIE)?.value;
  const session = await auth();
  const valid = Boolean(
    session?.user &&
    attempt &&
    ATTEMPT_PATTERN.test(attempt) &&
    expectedAttempt === attempt,
  );

  if (!valid || !popup) {
    const destination = valid ? "/" : "/?authError=invalid_attempt";
    const response = NextResponse.redirect(new URL(destination, PUBLIC_ORIGIN));
    response.cookies.delete(ATTEMPT_COOKIE);
    return response;
  }

  const script = `if(window.opener){window.opener.postMessage({type:"st:login-complete",attempt:${JSON.stringify(attempt)}},${JSON.stringify(PUBLIC_ORIGIN)});window.close()}else{location.replace("/")}`;
  const response = new NextResponse(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Completing login</title></head><body><p>Login complete. This window will close.</p><script>${script}</script><noscript><a href="/">Return to The Straits Times</a></noscript></body></html>`,
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "Content-Security-Policy": "default-src 'none'; script-src 'unsafe-inline'; style-src 'none'; base-uri 'none'; frame-ancestors 'none'",
        "Content-Type": "text/html; charset=utf-8",
        Pragma: "no-cache",
      },
    },
  );
  response.cookies.delete(ATTEMPT_COOKIE);
  return response;
}
