import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../auth";

const NONCE_COOKIE = "bt-login-nonce";
const PUBLIC_ORIGIN = "https://businesstimes.test";

export async function GET(request: NextRequest) {
  const expectedNonce = request.cookies.get(NONCE_COOKIE)?.value;
  const nonce = request.nextUrl.searchParams.get("nonce");
  const session = await auth();
  const valid = Boolean(session?.user && nonce && expectedNonce && nonce === expectedNonce);

  const script = valid
    ? `if(window.opener){const origin=${JSON.stringify(PUBLIC_ORIGIN)};const nonce=${JSON.stringify(nonce)};const send=()=>window.opener&&window.opener.postMessage({type:"bt:login-complete",nonce},origin);const onMessage=event=>{if(event.origin===origin&&event.source===window.opener&&event.data?.type==="bt:login-ack"&&event.data?.nonce===nonce){clearInterval(retry);window.removeEventListener("message",onMessage);window.close()}};window.addEventListener("message",onMessage);send();const retry=setInterval(send,150);setTimeout(()=>{clearInterval(retry);window.close()},3000)}else{location.replace("/")}`
    : `location.replace("/?authError=login")`;

  const response = new NextResponse(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Completing login</title></head><body><p>${valid ? "Login complete. This window will close." : "Login could not be verified. Returning to the site."}</p><script>${script}</script><noscript><a href="/">Return to The Business Times</a></noscript></body></html>`, {
    status: valid ? 200 : 401,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "Content-Security-Policy": "default-src 'none'; script-src 'unsafe-inline'; style-src 'none'; base-uri 'none'; frame-ancestors 'none'",
      "Content-Type": "text/html; charset=utf-8",
      Pragma: "no-cache",
    },
  });
  response.cookies.delete(NONCE_COOKIE);
  return response;
}
