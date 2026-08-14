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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { oryFrontendNative } from "@/lib/ory-sdk";
import { ORY_SESSION_TOKEN_KEY } from "@/app/login-native/page";
import type { LoginFlow, UiNode, UiNodeInputAttributes } from "@ory/client";
import { isAxiosError } from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function extractErrorMessage(err: unknown): string {
  if (isAxiosError(err)) {
    const messages = err.response?.data?.ui?.messages as
      | Array<{ text: string }>
      | undefined;
    if (messages?.length) {
      return messages.map((m) => m.text).join(" ");
    }
    const nodeMessages = (
      err.response?.data?.ui?.nodes as
        | Array<{ messages?: Array<{ text: string }> }>
        | undefined
    )
      ?.flatMap((n) => n.messages ?? [])
      .map((m) => m.text);
    if (nodeMessages?.length) {
      return nodeMessages.join(" ");
    }
  }
  return "Something went wrong. Please try again.";
}

function inputName(node: UiNode): string {
  return (node.attributes as UiNodeInputAttributes).name;
}

export default function StepUpPage() {
  return (
    <Suspense fallback={<p className="text-center mt-16 text-muted-foreground">Loading...</p>}>
      <StepUpForm />
    </Suspense>
  );
}

function StepUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") ?? "/sensitive";

  const [token, setToken] = useState<string | null>(null);
  const [flow, setFlow] = useState<LoginFlow | null>(null);
  const [totpCode, setTotpCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadFlow() {
      const existingToken = window.localStorage.getItem(ORY_SESSION_TOKEN_KEY);
      if (!existingToken) {
        setError("No active session. Please log in first.");
        return;
      }
      setToken(existingToken);

      try {
        const { data } = await oryFrontendNative.createNativeLoginFlow({
          aal: "aal2",
          xSessionToken: existingToken,
        });
        setFlow(data);
      } catch (err) {
        setError(extractErrorMessage(err));
      }
    }

    loadFlow();
  }, []);

  const totpNode = (flow?.ui?.nodes ?? []).find(
    (node) => node.group === "totp" && inputName(node) === "totp_code",
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!flow || !token) return;
    setError(null);
    setLoading(true);

    try {
      await oryFrontendNative.updateLoginFlow({
        flow: flow.id,
        xSessionToken: token,
        updateLoginFlowBody: {
          method: "totp",
          totp_code: totpCode,
        },
      });
      router.push(returnTo);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-1/2 m-auto mt-16">
      <Card>
        <CardHeader>
          <CardTitle>Step-up Authentication</CardTitle>
          <CardDescription>
            This route requires AAL2. Complete your second factor to continue —
            the existing session token will be upgraded in place.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <p className="text-sm text-destructive mb-4" role="alert">
              {error}
            </p>
          )}

          {!flow && !error && <p className="text-sm text-muted-foreground">Loading step-up flow...</p>}

          {flow && !totpNode && (
            <p className="text-sm text-muted-foreground">
              No AAL2 method (e.g. TOTP) is enrolled for this identity. Enroll one at{" "}
              <a className="underline" href="/auth/settings">
                /auth/settings
              </a>{" "}
              first.
            </p>
          )}

          {flow && totpNode && (
            <form onSubmit={handleSubmit}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="totp_code">Authenticator code</Label>
                  <Input
                    id="totp_code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Verifying..." : "Verify and step up"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
        <CardFooter>
          <p className="text-sm text-muted-foreground">
            Requesting AAL2 (<code>aal=aal2</code>) on the existing session token, the native equivalent
            of <code>refresh=true</code> for browser flows.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
