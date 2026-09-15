"use client";

import { Button } from "@/components/ui/button";

export function LoginButton({ returnTo = "/", label = "Log in" }: { returnTo?: string; label?: string }) {
  function start() {
    const nonce = crypto.randomUUID();
    const url = new URL("/auth/start", window.location.origin);
    url.searchParams.set("return_to", returnTo);
    url.searchParams.set("nonce", nonce);
    window.location.assign(url);
  }

  return <Button type="button" onClick={start}>{label}</Button>;
}
