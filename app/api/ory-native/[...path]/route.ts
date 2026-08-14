import { NextRequest, NextResponse } from "next/server";

// Proxies native (API-style) Ory flow requests server-to-server.
// Kratos rejects API flows that carry a browser "Origin" header (see
// lib/ory-sdk.ts) — calling fetch directly from the browser always sends
// one, tunnel or not. Routing through this Next.js Route Handler means
// Kratos only ever sees a plain server-to-server request.
//
// Also doubles as the proxy for cookie-based session list/revoke calls
// (/sessions, /sessions/{id}): the @ory/nextjs middleware only proxies
// /sessions/whoami, not those paths, so they're forwarded here instead —
// which is why "cookie" and "set-cookie" are forwarded too, not just the
// session token.
const ORY_SDK_URL = process.env.ORY_SDK_URL ?? "";

const FORWARDED_REQUEST_HEADERS = [
  "content-type",
  "accept",
  "accept-language",
  "authorization",
  "x-session-token",
  "cookie",
];
const OMITTED_RESPONSE_HEADERS = ["content-encoding", "content-length", "transfer-encoding"];

async function proxy(request: NextRequest, params: Promise<{ path: string[] }>) {
  const { path } = await params;
  const upstreamUrl = new URL(`/${path.join("/")}`, ORY_SDK_URL);
  upstreamUrl.search = request.nextUrl.search;

  const headers = new Headers();
  for (const name of FORWARDED_REQUEST_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  const upstreamResponse = await fetch(upstreamUrl, {
    method: request.method,
    headers,
    body: request.method !== "GET" && request.method !== "HEAD" ? await request.text() : undefined,
  });

  const responseHeaders = new Headers(upstreamResponse.headers);
  for (const name of OMITTED_RESPONSE_HEADERS) {
    responseHeaders.delete(name);
  }

  return new NextResponse(upstreamResponse.body, {
    status: upstreamResponse.status,
    headers: responseHeaders,
  });
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(request, params);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(request, params);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(request, params);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(request, params);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(request, params);
}
