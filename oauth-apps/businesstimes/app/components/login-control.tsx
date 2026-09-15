"use client";

import { useEffect, useRef, useState } from "react";

const POPUP_TIMEOUT_MS = 120_000;

export function LoginControl() {
  const popup = useRef<Window | null>(null);
  const [fallbackUrl, setFallbackUrl] = useState<string>();
  const [status, setStatus] = useState("");

  useEffect(() => () => popup.current?.close(), []);

  function beginLogin() {
    const nonce = crypto.randomUUID();
    const startUrl = `/auth/start?nonce=${encodeURIComponent(nonce)}`;
    setFallbackUrl(startUrl);

    if (matchMedia("(pointer: coarse)").matches || matchMedia("(max-width: 560px)").matches) {
      location.assign(startUrl);
      return;
    }

    const child = window.open(startUrl, "bt-login", "popup,width=520,height=720");
    popup.current = child;
    if (!child) {
      setStatus("The login window was blocked. Continuing in this tab.");
      location.assign(startUrl);
      return;
    }

    setStatus("Complete login in the new window.");
    child.focus();

    let finished = false;
    const finish = () => {
      finished = true;
      clearInterval(closedCheck);
      clearTimeout(timeout);
      window.removeEventListener("message", receiveCompletion);
    };
    const fallbackToSameTab = (message: string) => {
      if (finished) return;
      finish();
      setStatus(message);
      location.assign(startUrl);
    };
    const receiveCompletion = (event: MessageEvent) => {
      if (
        event.origin !== location.origin ||
        event.source !== child ||
        event.data?.type !== "bt:login-complete" ||
        event.data?.nonce !== nonce
      ) return;

      finish();
      setStatus("Login complete. Refreshing the page.");
      child.close();
      location.reload();
    };

    window.addEventListener("message", receiveCompletion);
    const closedCheck = window.setInterval(() => {
      if (child.closed) fallbackToSameTab("The login window closed. Continuing in this tab.");
    }, 500);
    const timeout = window.setTimeout(() => {
      child.close();
      fallbackToSameTab("Login took too long. Continuing in this tab.");
    }, POPUP_TIMEOUT_MS);
  }

  return (
    <div className="login-control">
      <button className="login-button" type="button" onClick={beginLogin}>Log in</button>
      <span className="auth-status" role="status" aria-live="polite">{status}</span>
      {fallbackUrl && <a className="login-fallback" href={fallbackUrl}>Continue login in this tab</a>}
    </div>
  );
}
