"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ORY_SESSION_TOKEN_KEY } from "@/app/login-native/page";
import { oryFrontendNative } from "@/lib/ory-sdk";
import { isAxiosError } from "axios";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

// Message contract between this page (opener) and the popup callback page.
export const GOOGLE_AUTH_MESSAGE = "ory:google-auth";

type GoogleAuthMessage =
  | { type: typeof GOOGLE_AUTH_MESSAGE; ok: true; sessionToken: string }
  | { type: typeof GOOGLE_AUTH_MESSAGE; ok: false; error: string };

export default function GoogleLoginPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "pending">("idle");
  const [error, setError] = useState<string | null>(null);
  const popupRef = useRef<Window | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    function cleanup() {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      popupRef.current = null;
      setStatus("idle");
    }

    function onMessage(event: MessageEvent<GoogleAuthMessage>) {
      // Only trust messages from our own origin and our own popup.
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== GOOGLE_AUTH_MESSAGE) return;

      popupRef.current?.close();
      cleanup();

      if (event.data.ok) {
        window.localStorage.setItem(ORY_SESSION_TOKEN_KEY, event.data.sessionToken);
        router.push("/profile");
      } else {
        setError(event.data.error || "Could not complete Google login.");
      }
    }

    window.addEventListener("message", onMessage);
    return () => {
      window.removeEventListener("message", onMessage);
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [router]);

  async function startGoogleLogin() {
    setError(null);
    setStatus("pending");

    // Open the popup synchronously in the click handler so the browser
    // treats it as user-initiated and doesn't block it.
    const popup = window.open(
      "about:blank",
      "ory-google-login",
      "width=500,height=650,menubar=no,toolbar=no,location=no,status=no",
    );

    if (!popup) {
      setStatus("idle");
      setError("Popup was blocked. Please allow popups and try again.");
      return;
    }
    popupRef.current = popup;

    try {
      const returnTo = `${window.location.origin}/auth/google/callback`;
      const { data: flow } = await oryFrontendNative.createNativeLoginFlow({
        returnSessionTokenExchangeCode: true,
        returnTo,
      });

      const initCode = flow.session_token_exchange_code;
      if (initCode) {
        // localStorage (not sessionStorage) so the popup — a separate window
        // context — can read the exchange code on the same origin.
        window.localStorage.setItem("ory_session_token_exchange_code", initCode);
      }

      const providerId = flow.ui.nodes
        .flatMap((node) => (node.attributes.node_type === "input" ? [node.attributes] : []))
        .find((attrs) => attrs.name === "provider")?.value as string | undefined;

      if (!providerId) {
        throw new Error("Google OIDC provider not configured on this flow.");
      }

      const { data: result } = await oryFrontendNative.updateLoginFlow({
        flow: flow.id,
        updateLoginFlowBody: { method: "oidc", provider: providerId },
      });

      const redirectTo = resolveRedirect(result);
      if (!redirectTo) {
        throw new Error("Ory did not return a Google authorization URL.");
      }

      // Drive the popup (not the whole page) to Google.
      popup.location.href = redirectTo;

      // If the user closes the popup manually, reset back to idle.
      pollRef.current = setInterval(() => {
        if (popup.closed) {
          if (pollRef.current) clearInterval(pollRef.current);
          pollRef.current = null;
          setStatus("idle");
        }
      }, 500);
    } catch (err) {
      const redirectTo = isAxiosError(err)
        ? resolveRedirect(err.response?.data)
        : undefined;
      if (redirectTo) {
        popup.location.href = redirectTo;
        return;
      }
      popup.close();
      popupRef.current = null;
      setStatus("idle");
      setError("Could not start Google login. Please try again.");
    }
  }

  return (
    <div className="w-1/2 m-auto mt-16">
      <Card>
        <CardHeader>
          <CardTitle>Continue with Google</CardTitle>
          <CardDescription>
            Popup-based OIDC login. Google authenticates in a popup window and
            posts the Ory session token back via window.postMessage — no
            full-page redirect.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <Button
            onClick={startGoogleLogin}
            disabled={status === "pending"}
            className="w-full"
          >
            {status === "pending" ? "Waiting for Google…" : "Sign in with Google"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function resolveRedirect(data: unknown): string | undefined {
  return (data as { redirect_browser_to?: string } | undefined)?.redirect_browser_to;
}
