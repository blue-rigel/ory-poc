import { NextRequest, NextResponse } from "next/server";

import { auth, ORY_ISSUER, signOut } from "@/auth";

export async function GET(request: NextRequest) {
  const issuer = request.nextUrl.searchParams.get("iss");
  const sid = request.nextUrl.searchParams.get("sid");
  const session = await auth();

  if (issuer === ORY_ISSUER && sid && session?.oryIssuer === issuer && session.orySid === sid) {
    await signOut({ redirect: false });
  }

  return new NextResponse("<!doctype html><title>Signed out</title>", {
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}
