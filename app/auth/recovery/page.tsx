import { getRecoveryFlow, OryPageParams } from "@ory/nextjs/app";

import { FlowCard } from "@/components/ory/flow-card";
import config from "@/ory.config";

export default async function RecoveryPage(props: OryPageParams) {
  const flow = await getRecoveryFlow(config, props.searchParams);

  if (!flow) {
    return null;
  }

  return <FlowCard ui={flow.ui} title="Recover account" description="Use your email or recovery code to regain access." footer={{ href: "/login", label: "Back to login" }} />;
}
