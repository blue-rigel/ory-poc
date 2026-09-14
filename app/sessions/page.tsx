"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { oryFrontend, oryFrontendSessions } from "@/lib/ory-sdk";
import type { Session } from "@ory/client";
import { isAxiosError } from "axios";
import Link from "next/link";
import { useEffect, useState } from "react";

type AuthState =
  | { status: "loading" }
  | { status: "anonymous" }
  | { status: "authenticated"; currentSession: Session };

export default function SessionsPage() {
  const [auth, setAuth] = useState<AuthState>({ status: "loading" });
  const [sessions, setSessions] = useState<Session[] | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const { data } = await oryFrontend.toSession();
        if (cancelled) return;
        setAuth({ status: "authenticated", currentSession: data });
        setSessions([data]);

        try {
          const { data: list } = await oryFrontendSessions.listMySessions();
          if (!cancelled) setSessions([data, ...list]);
        } catch (err) {
          if (!cancelled) {
            setError(
              isAxiosError(err)
                ? err.response?.data?.error?.message ?? "Failed to load other sessions."
                : "Failed to load other sessions.",
            );
          }
        }
        return;
      } catch {
        if (!cancelled) setAuth({ status: "anonymous" });
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleRevoke(id: string) {
    if (auth.status !== "authenticated") return;
    setError(null);
    setRevokingId(id);

    try {
      await oryFrontendSessions.disableMySession({ id });
      setSessions((prev) => prev?.filter((s) => s.id !== id) ?? null);
    } catch (err) {
      setError(
        isAxiosError(err)
          ? err.response?.data?.error?.message ?? "Failed to revoke session."
          : "Failed to revoke session.",
      );
    } finally {
      setRevokingId(null);
    }
  }

  if (auth.status === "loading") {
    return <p className="text-center mt-16 text-muted-foreground">Loading...</p>;
  }

  if (auth.status === "anonymous") {
    return (
      <div className="w-1/2 m-auto mt-16 text-center">
        <p className="text-muted-foreground mb-4">You are not logged in.</p>
        <Button asChild>
          <Link href="/login?return_to=/sessions">Log in</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="w-1/2 m-auto mt-16">
      <Card>
        <CardHeader>
          <CardTitle>Active Sessions</CardTitle>
          <CardDescription>
            Every session currently issued to your identity, across browsers and
            devices. Revoking a session immediately invalidates it.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          {sessions === null && <p className="text-muted-foreground">Loading sessions...</p>}
          {sessions?.length === 0 && (
            <p className="text-muted-foreground">No active sessions.</p>
          )}
          {sessions?.map((session) => {
            const isCurrent = session.id === auth.currentSession.id;
            const device = session.devices?.[0];
            return (
              <div
                key={session.id}
                className="flex items-start justify-between gap-4 border-b py-3 last:border-0"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{device?.user_agent ?? "Unknown device"}</span>
                    {isCurrent && <Badge>This device</Badge>}
                    {session.authenticator_assurance_level && (
                      <Badge variant="outline">
                        {session.authenticator_assurance_level.toUpperCase()}
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground text-xs">
                    {device?.ip_address ?? "Unknown IP"}
                    {device?.location ? ` · ${device.location}` : ""}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Authenticated at {session.authenticated_at ?? "—"}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Expires at {session.expires_at ?? "—"}
                  </p>
                </div>
                {!isCurrent && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={revokingId === session.id}
                    onClick={() => handleRevoke(session.id)}
                  >
                    {revokingId === session.id ? "Revoking..." : "Revoke"}
                  </Button>
                )}
              </div>
            );
          })}
        </CardContent>
        <CardFooter>
          <Button asChild variant="outline">
            <Link href="/profile">Back to profile</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
