"use client";

import { useEffect } from "react";

export type OryFlowType =
  | "login"
  | "registration"
  | "recovery"
  | "verification"
  | "settings";

const FLOW_STORAGE_PREFIX = "ory:flow:";

type FlowBootstrapProps = {
  flowType: OryFlowType;
};

export function FlowBootstrap({ flowType }: FlowBootstrapProps) {
  useEffect(() => {
    const currentUrl = new URL(window.location.href);
    const storedFlowId = readFlowId(flowType);

    if (storedFlowId) {
      currentUrl.searchParams.set("flow", storedFlowId);
      window.location.replace(currentUrl.toString());
      return;
    }

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

type FlowSessionProps = {
  flowId: string;
  flowType: OryFlowType;
};

export function FlowSession({ flowId, flowType }: FlowSessionProps) {
  useEffect(() => {
    writeFlowId(flowType, flowId);

    const currentUrl = new URL(window.location.href);
    if (!currentUrl.searchParams.has("flow")) {
      return;
    }

    currentUrl.searchParams.delete("flow");
    window.history.replaceState(window.history.state, "", currentUrl.toString());
  }, [flowId, flowType]);

  return null;
}

function readFlowId(flowType: OryFlowType) {
  try {
    return window.sessionStorage.getItem(`${FLOW_STORAGE_PREFIX}${flowType}`);
  } catch {
    return null;
  }
}

function writeFlowId(flowType: OryFlowType, flowId: string) {
  try {
    window.sessionStorage.setItem(`${FLOW_STORAGE_PREFIX}${flowType}`, flowId);
  } catch {
    // Storage can be unavailable in privacy-restricted browser contexts.
  }
}
