"use client";

import { useEffect } from "react";

export default function PopupComplete() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const nonce = params.get("nonce");
    const returnTo = params.get("return_to") ?? "/";
    if (!nonce || !window.opener) {
      window.location.replace(returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/");
      return;
    }
    window.opener.postMessage({ type: "ory-login-complete", nonce }, window.location.origin);
    window.close();
  }, []);

  return <p className="mt-16 text-center" role="status">Login complete. You may close this window.</p>;
}
