"use client";

import { useEffect, useRef, useState } from "react";

const POPUP_TIMEOUT = 120_000;

function createAttempt() {
  return Array.from(crypto.getRandomValues(new Uint8Array(24)), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function LoginButton() {
  const popupRef = useRef<Window | null>(null);
  const [status, setStatus] = useState("");
  const [fallbackUrl, setFallbackUrl] = useState("/auth/start");

  useEffect(() => () => popupRef.current?.close(), []);

  function logIn() {
    const attempt = createAttempt();
    const startUrl = `/auth/start?attempt=${attempt}&popup=1`;
    const sameTabUrl = `/auth/start?attempt=${attempt}`;
    setFallbackUrl(sameTabUrl);

    if (matchMedia("(pointer: coarse)").matches || matchMedia("(max-width: 560px)").matches) {
      window.location.assign(sameTabUrl);
      return;
    }

    const popup = window.open(startUrl, "st-login", "popup,width=520,height=720");
    if (!popup) {
      setStatus("The login window was blocked. Continuing in this tab.");
      window.location.assign(sameTabUrl);
      return;
    }

    popupRef.current = popup;
    setStatus("Complete login in the new window.");

    let finished = false;
    const cleanUp = () => {
      window.clearInterval(closedTimer);
      window.clearTimeout(timeoutTimer);
      window.removeEventListener("message", onMessage);
    };
    const fallbackToSameTab = (message: string) => {
      if (finished) return;
      finished = true;
      cleanUp();
      setStatus(message);
      window.location.assign(sameTabUrl);
    };
    const onMessage = (event: MessageEvent) => {
      if (
        event.origin !== window.location.origin ||
        event.source !== popup ||
        event.data?.type !== "st:login-complete" ||
        event.data?.attempt !== attempt
      ) return;

      finished = true;
      cleanUp();
      popup.postMessage({ type: "st:login-ack", attempt }, window.location.origin);
      setStatus("Login complete. Refreshing the page.");
      window.setTimeout(() => window.location.reload(), 150);
    };
    window.addEventListener("message", onMessage);
    const closedTimer = window.setInterval(() => {
      if (popup.closed) fallbackToSameTab("The login window closed. Continuing in this tab.");
    }, 500);
    const timeoutTimer = window.setTimeout(() => {
      popup.close();
      fallbackToSameTab("Login took too long. Continuing in this tab.");
    }, POPUP_TIMEOUT);
  }

  return (
    <div className="login-control">
      <button className="login-button" type="button" onClick={logIn}>Log in</button>
      <span className="auth-status" role="status" aria-live="polite">{status}</span>
      {status && <a className="auth-fallback" href={fallbackUrl}>Continue login in this tab</a>}
    </div>
  );
}
