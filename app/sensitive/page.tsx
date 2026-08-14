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
import { oryFrontendNative } from "@/lib/ory-sdk";
import { ORY_SESSION_TOKEN_KEY } from "@/app/login-native/page";
import { hasRequiredAal, REQUIRED_AAL_ROUTES } from "@/lib/step-up";
import type { Session } from "@ory/client";
import { isAxiosError } from "axios";
import Link from "next/link";
import { useEffect, useState } from "react";

const REQUIRED_AAL = REQUIRED_AAL_ROUTES.sensitive;

type PageState =
  | { status: "loading" }
  | { status: "anonymous" }
  | { status: "authenticated"; session: Session }
  // Ory's whoami endpoint itself enforces `required_aal: highest_available`
  // (project-config.yaml), so a logged-in AAL1 session with a stronger
  // method enrolled gets a 403 with no session body — not "not logged in".
  | { status: "insufficient-aal" };

export default function SensitivePage() {
  const [state, setState] = useState<PageState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function loadSession() {
      const token = window.localStorage.getItem(ORY_SESSION_TOKEN_KEY);
      if (!token) {
        if (!cancelled) setState({ status: "anonymous" });
        return;
      }

      try {
        const { data } = await oryFrontendNative.toSession({ xSessionToken: token });
        if (!cancelled) setState({ status: "authenticated", session: data });
      } catch (err) {
        const isAalError = isAxiosError(err) && err.response?.data?.error?.id === "session_aal2_required";
        if (!cancelled) setState({ status: isAalError ? "insufficient-aal" : "anonymous" });
      }
    }

    loadSession();
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.status === "loading") {
    return <p className="text-center mt-16 text-muted-foreground">Loading...</p>;
  }

  if (state.status === "anonymous") {
    return (
      <div className="w-1/2 m-auto mt-16 text-center">
        <p className="text-muted-foreground mb-4">You are not logged in.</p>
        <Button asChild>
          <Link href="/login-native">Log in (native)</Link>
        </Button>
      </div>
    );
  }

  if (state.status === "insufficient-aal") {
    return (
      <div className="w-1/2 m-auto mt-16">
        <Card>
          <CardHeader>
            <CardTitle>Step-up Assessment</CardTitle>
            <CardDescription>
              Ory&apos;s own session endpoint enforces <code>required_aal: highest_available</code>{" "}
              (project-config.yaml) and rejected this AAL1 session outright — confirming step-up
              is required before any session details can even be read.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Required AAL" value={REQUIRED_AAL} />
            <Row label="Assessment result" value="FAIL — step-up required" />
          </CardContent>
          <CardFooter>
            <Button asChild>
              <Link href={`/login-native/step-up?returnTo=${encodeURIComponent("/sensitive")}`}>
                Step up to {REQUIRED_AAL}
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const { session } = state;
  const currentAal = session.authenticator_assurance_level ?? "aal0";
  const stepUpOk = hasRequiredAal(session, REQUIRED_AAL);

  return (
    <div className="w-1/2 m-auto mt-16 flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Step-up Assessment</CardTitle>
          <CardDescription>
            Values used to decide whether this session may access the sensitive route.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <Row label="Required AAL" value={REQUIRED_AAL} />
          <Row label="Current AAL" value={currentAal} />
          <Row label="Assessment result" value={stepUpOk ? "PASS" : "FAIL — step-up required"} />
          <div className="pt-2">
            <span className="text-muted-foreground">Authentication methods</span>
            <ul className="mt-1 space-y-1">
              {(session.authentication_methods ?? []).map((m, i) => (
                <li key={i} className="flex justify-between border-b py-1 last:border-0">
                  <span>{m.method}</span>
                  <span className="font-medium">
                    {m.aal} @ {m.completed_at}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
        {!stepUpOk && (
          <CardFooter>
            <Button asChild>
              <Link href={`/login-native/step-up?returnTo=${encodeURIComponent("/sensitive")}`}>
                Step up to {REQUIRED_AAL}
              </Link>
            </Button>
          </CardFooter>
        )}
      </Card>

      {stepUpOk && (
        <Card>
          <CardHeader>
            <CardTitle>Sensitive Data {"✓ AAL2"}</CardTitle>
            <CardDescription>Unlocked because the session satisfies the required AAL.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm">
            <p>Billing Details: MYSPH User</p>
            <p>NRIC/FIN (last 4): 1234</p>
          </CardContent>
        </Card>
      )}
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
