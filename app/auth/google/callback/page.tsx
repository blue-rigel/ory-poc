"use client";

import { GOOGLE_AUTH_MESSAGE } from "@/app/auth/google/page";
import { oryFrontendNative } from "@/lib/ory-sdk";
import { ORY_SESSION_TOKEN_KEY } from "@/app/login-native/page";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function GoogleCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    // This page runs inside the popup opened by /auth/google. Notify the
    // opener with the result and close, instead of navigating this window.
    function notifyOpener(payload:
      | { ok: true; sessionToken: string }
      | { ok: false; error: string },
    ): boolean {
      const opener = window.opener as Window | null;
      if (!opener || opener.closed) return false;
      opener.postMessage(
        { type: GOOGLE_AUTH_MESSAGE, ...payload },
        window.location.origin,
      );
      return true;
    }

    async function completeGoogleLogin() {
      const initCode = window.localStorage.getItem("ory_session_token_exchange_code");
      const returnToCode = new URLSearchParams(window.location.search).get("code");

      if (!initCode || !returnToCode) {
        const msg = "Missing login code. Please try signing in again.";
        if (!notifyOpener({ ok: false, error: msg }) && !cancelled) setError(msg);
        return;
      }

      try {
        const { data } = await oryFrontendNative.exchangeSessionToken({
          initCode,
          returnToCode,
        });
        window.localStorage.removeItem("ory_session_token_exchange_code");
        const sessionToken = data.session_token ?? "";

        // Preferred path: hand the token to the opener via postMessage.
        if (notifyOpener({ ok: true, sessionToken })) {
          window.close();
          return;
        }

        // Fallback (opened directly, no opener): behave like the old flow.
        if (!cancelled) {
          window.localStorage.setItem(ORY_SESSION_TOKEN_KEY, sessionToken);
          router.push("/profile");
        }
      } catch {
        const msg = "Could not complete Google login. Please try again.";
        if (!notifyOpener({ ok: false, error: msg })) {
          if (!cancelled) setError(msg);
        } else {
          window.close();
        }
      }
    }

    completeGoogleLogin();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center gap-4 min-h-[calc(100vh-4rem)]">
      <p className="text-muted-foreground text-sm" role={error ? "alert" : undefined}>
        {error ?? "Finishing sign-in…"}
      </p>
    </div>
  );
}
