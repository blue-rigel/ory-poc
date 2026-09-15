"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";

const POPUP_TIMEOUT = 120_000;

export function LoginButton({ returnTo = "/", label = "Log in" }: { returnTo?: string; label?: string }) {
  const [status, setStatus] = useState("");
  const popupRef = useRef<Window | null>(null);
  const nonceRef = useRef("");

  function start(sameTab = false) {
    const nonce = crypto.randomUUID();
    nonceRef.current = nonce;
    const url = new URL("/auth/start", window.location.origin);
    url.searchParams.set("return_to", returnTo);
    url.searchParams.set("nonce", nonce);

    const mobile = window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 768;
    if (sameTab || mobile) {
      window.location.assign(url);
      return;
    }

    url.searchParams.set("popup", "1");
    const width = 520;
    const height = 720;
    const left = Math.max(0, window.screenX + (window.outerWidth - width) / 2);
    const top = Math.max(0, window.screenY + (window.outerHeight - height) / 2);
    popupRef.current = window.open(url, "ory-login", `popup,width=${width},height=${height},left=${left},top=${top}`);
    if (!popupRef.current) {
      start(true);
      return;
    }
    setStatus("Complete login in the opened window.");
  }

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== "ory-login-complete" || event.data?.nonce !== nonceRef.current) return;
      setStatus("Login complete. Refreshing...");
      window.location.reload();
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  useEffect(() => {
    if (!status) return;
    const interval = window.setInterval(() => {
      if (popupRef.current?.closed) {
        window.clearInterval(interval);
        setStatus("The login window closed before completion.");
      }
    }, 500);
    const timeout = window.setTimeout(() => {
      window.clearInterval(interval);
      setStatus("Login timed out. Continue in this window.");
    }, POPUP_TIMEOUT);
    return () => { window.clearInterval(interval); window.clearTimeout(timeout); };
  }, [status]);

  return (
    <div className="flex flex-col items-start gap-2">
      <Button type="button" onClick={() => start()}>{label}</Button>
      {status && <p className="text-sm text-muted-foreground" role="status">{status}</p>}
      {status && <button className="text-sm underline" type="button" onClick={() => start(true)}>Continue in this window</button>}
    </div>
  );
}
