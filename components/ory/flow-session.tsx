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
};

export function FlowBootstrap({ flowType }: FlowBootstrapProps) {
  useEffect(() => {
    const currentUrl = new URL(window.location.href);
    const initializationUrl = new URL(
      `/self-service/${flowType}/browser`,
      window.location.origin,
    );
    currentUrl.searchParams.forEach((value, key) => {
      initializationUrl.searchParams.append(key, value);
    });
    window.location.replace(initializationUrl.toString());
  }, [flowType]);

  return null;
}
