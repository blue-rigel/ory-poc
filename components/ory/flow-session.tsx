"use client";

import { useEffect } from "react";

export type OryFlowType =
  | "login"
  | "registration"
  | "recovery"
  | "verification"
  | "settings";

type FlowBootstrapProps = {
  flowType: OryFlowType;
  returnTo?: string;
};

export function FlowBootstrap({ flowType, returnTo }: FlowBootstrapProps) {
  useEffect(() => {
    const currentUrl = new URL(window.location.href);
    const initializationUrl = new URL(
      `/self-service/${flowType}/browser`,
      window.location.origin,
    );
    if (returnTo) initializationUrl.searchParams.set("return_to", returnTo);
    for (const key of ["aal", "refresh", "organization"]) {
      const value = currentUrl.searchParams.get(key);
      if (value) initializationUrl.searchParams.set(key, value);
    }
    window.location.replace(initializationUrl.toString());
  }, [flowType, returnTo]);

  return null;
}
