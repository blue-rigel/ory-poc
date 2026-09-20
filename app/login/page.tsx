import { getLoginFlow, type OryPageParams } from "@ory/nextjs/app";
import type { UiNodeInputAttributes } from "@ory/client";

import { FlowCard } from "@/components/ory/flow-card";
import { StepUpUnavailable } from "@/components/ory/step-up-unavailable";
import { FlowBootstrap } from "@/components/ory/flow-session";
import config from "@/ory.config";

export default async function LoginPage(props: OryPageParams) {
  const searchParams = await props.searchParams;
  if (!searchParams.flow) {
    const returnTo = typeof searchParams.return_to === "string" ? searchParams.return_to : undefined;
    let safeReturnTo: string | undefined;
    if (returnTo) {
      try {
        const target = new URL(returnTo, "https://ory.the-blue-rigel.com");
        if (target.origin === "https://ory.the-blue-rigel.com") safeReturnTo = target.toString();
      } catch {
        safeReturnTo = undefined;
      }
    }
    return <FlowBootstrap flowType="login" returnTo={safeReturnTo} />;
  }

  const flow = await getLoginFlow(config, searchParams);

  if (!flow) {
    return null;
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
