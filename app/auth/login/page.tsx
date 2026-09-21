import type { OryPageParams } from "@ory/nextjs/app";
import type { UiNodeInputAttributes } from "@ory/client";
import { isAxiosError } from "axios";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { FlowCard } from "@/components/ory/flow-card";
import { StepUpUnavailable } from "@/components/ory/step-up-unavailable";
import { oryFrontend } from "@/lib/ory-sdk";

export default async function LoginPage(props: OryPageParams) {
  const searchParams = await props.searchParams;
  if (!searchParams.flow) {
    redirect(loginFlowUrl(searchParams));
  }

  let flow;
  try {
    const cookie = (await headers()).get("cookie") ?? "";
    const response = await oryFrontend.getLoginFlow({ id: searchParams.flow.toString(), cookie });
    flow = response.data;
  } catch (error) {
    if (isAxiosError(error) && [400, 403, 404, 410].includes(error.response?.status ?? 0)) {
      redirect(loginFlowUrl(searchParams));
    }
    throw error;
  }

  const isStepUp =
    new URL(flow.request_url).searchParams.get("aal") === "aal2" ||
    flow.ui.nodes.some(
      (node) =>
        node.type === "input" &&
        (node.attributes as UiNodeInputAttributes).name === "totp_code",
    );
  const hasStepUpMethod = flow.ui.nodes.some((node) =>
    ["totp", "webauthn", "lookup_secret", "code"].includes(node.group),
  );

  if (isStepUp && !hasStepUpMethod) {
    return <StepUpUnavailable />;
  }

  return (
    <FlowCard
      flowType="login"
      ui={flow.ui}
      title={isStepUp ? "Verify your identity" : "Login"}
      description={
        isStepUp
          ? "Complete your second authentication factor to continue."
          : "Sign in to continue to the application."
      }
      footer={isStepUp ? undefined : { href: "/auth/registration", label: "Need an account? Register" }}
    />
  );
}

function loginFlowUrl(searchParams: Record<string, string | string[] | undefined>) {
  const params = new URLSearchParams();
  const returnTo = typeof searchParams.return_to === "string" ? searchParams.return_to : undefined;

  if (returnTo) {
    try {
      const target = new URL(returnTo, "https://ory.the-blue-rigel.com");
      if (target.origin === "https://ory.the-blue-rigel.com") {
        params.set("return_to", target.toString());
      }
    } catch {
      // Ignore malformed return URLs.
    }
  }

  for (const key of ["aal", "refresh", "organization"] as const) {
    const value = searchParams[key];
    if (typeof value === "string") params.set(key, value);
  }

  const query = params.toString();
  return `/self-service/login/browser${query ? `?${query}` : ""}`;
}
