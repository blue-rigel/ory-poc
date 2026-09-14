import { getLoginFlow, type OryPageParams } from "@ory/nextjs/app";
import type { UiNodeInputAttributes } from "@ory/client";

import { FlowCard } from "@/components/ory/flow-card";
import config from "@/ory.config";

export default async function LoginPage(props: OryPageParams) {
  const flow = await getLoginFlow(config, props.searchParams);

  if (!flow) {
    return null;
  }

  const isStepUp = flow.ui.nodes.some(
    (node) =>
      node.type === "input" &&
      (node.attributes as UiNodeInputAttributes).name === "totp_code",
  );

  return (
    <FlowCard
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
