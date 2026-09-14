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

type AuthState =
  | { status: "loading" }
  | { status: "anonymous" }
  | { status: "authenticated"; session: Session };

export default function ProfilePage() {
  const [state, setState] = useState<AuthState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function loadSession() {
      try {
        const { data } = await oryFrontend.toSession();
        if (!cancelled) setState({ status: "authenticated", session: data });
      } catch {
        if (!cancelled) setState({ status: "anonymous" });
      }
    }

    loadSession();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleLogout() {
    if (state.status !== "authenticated") return;

    const { data } = await oryFrontend.createBrowserLogoutFlow();
    window.location.href = data.logout_url;
  }

  if (state.status === "loading") {
    return <p className="text-center mt-16 text-muted-foreground">Loading...</p>;
  }

  if (state.status === "anonymous") {
    return (
      <div className="w-1/2 m-auto mt-16 text-center">
        <p className="text-muted-foreground mb-4">You are not logged in.</p>
        <Button asChild>
          <Link href="/login?return_to=/profile">Log in</Link>
        </Button>
      </div>
    );
  }

  const { identity } = state.session;
  const traits = (identity?.traits ?? {}) as Record<string, unknown>;

  return (
    <div className="w-1/2 m-auto mt-16">
      <Card>
        <CardHeader>
          <CardTitle>User Profile</CardTitle>
          <CardDescription>Session established via the Ory browser flow.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <Row label="Identity ID" value={identity?.id} />
          <Row label="Schema ID" value={identity?.schema_id} />
          <Row label="Authenticated at" value={state.session.authenticated_at} />
          {Object.entries(traits).map(([key, value]) => (
            <Row key={key} label={key} value={JSON.stringify(value)} />
          ))}
        </CardContent>
        <CardFooter className="gap-2">
          <Button asChild variant="outline">
            <Link href="/sessions">Manage sessions</Link>
          </Button>
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between gap-4 border-b py-1 last:border-0">
      <span className="text-muted-foreground capitalize">{label}</span>
      <span className="font-medium">{value ?? "—"}</span>
    </div>
  );
}
