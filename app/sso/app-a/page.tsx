"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { oryFrontend } from "@/lib/ory-sdk";
import type { Session } from "@ory/client";
import Link from "next/link";
import { useEffect, useState } from "react";

// Independent app that only knows how to ask Kratos "who am I" via the
// shared first-party session cookie. No code or state is shared with App B —
// the only thing they have in common is the cookie the browser sends.
type AuthState =
  | { status: "loading" }
  | { status: "anonymous" }
  | { status: "authenticated"; session: Session };

export default function SsoAppA() {
  const [state, setState] = useState<AuthState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    oryFrontend
      .toSession()
      .then(({ data }) => {
        if (!cancelled) setState({ status: "authenticated", session: data });
      })
      .catch(() => {
        if (!cancelled) setState({ status: "anonymous" });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="w-1/2 m-auto mt-16">
      <Card>
        <CardHeader>
          <CardTitle>App A</CardTitle>
          <CardDescription>
            Reads the shared Ory session cookie independently — no shared code with App B.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          {state.status === "loading" && <p className="text-muted-foreground">Loading...</p>}
          {state.status === "anonymous" && (
            <p className="text-muted-foreground">Not logged in here.</p>
          )}
          {state.status === "authenticated" && (
            <>
              <Row
                label="Email"
                value={String((state.session.identity?.traits as Record<string, unknown>)?.email ?? "—")}
              />
              <Row label="Identity ID" value={state.session.identity?.id ?? "—"} />
              <Row label="Authenticated at" value={state.session.authenticated_at ?? "—"} />
            </>
          )}
        </CardContent>
        <CardFooter className="gap-2">
          {state.status !== "authenticated" && (
            <Button asChild>
              <Link href="/auth/login">Log in</Link>
            </Button>
          )}
          <Button asChild variant="outline">
            <Link href="/sso/app-b">Go to App B</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b py-1 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
