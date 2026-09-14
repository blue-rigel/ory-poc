import { NextRequest } from "next/server";

// Proxies cookie-based session list/revoke calls
// (/sessions, /sessions/{id}): the @ory/nextjs middleware only proxies
// /sessions/whoami, not those paths, so they're forwarded here instead —
// including the browser's Ory session cookie.
const ORY_SDK_URL = process.env.ORY_SDK_URL ?? "";

const FORWARDED_REQUEST_HEADERS = [
  "content-type",
  "accept",
  "accept-language",
  "cookie",
];
async function proxy(request: NextRequest, params: Promise<{ path: string[] }>) {
  try {
    if (!ORY_SDK_URL) {
      throw new Error("ORY_SDK_URL is not configured.");
    }

    const { path } = await params;
    const upstreamUrl = new URL(`/${path.join("/")}`, ORY_SDK_URL);
    upstreamUrl.search = request.nextUrl.search;

    const headers = new Headers();
    for (const name of FORWARDED_REQUEST_HEADERS) {
      const value = request.headers.get(name);
      if (value) headers.set(name, value);
    }

    return await fetch(upstreamUrl, {
      method: request.method,
      headers,
      body: request.method !== "GET" && request.method !== "HEAD" ? await request.text() : undefined,
      cache: "no-store",
    });
  } catch (error) {
    console.error("Failed to proxy Ory session request", error);
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Failed to reach Ory.",
      },
      { status: 502 },
    );
  }
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
