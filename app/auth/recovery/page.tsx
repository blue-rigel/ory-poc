import { getRecoveryFlow, OryPageParams } from "@ory/nextjs/app";

import { FlowCard } from "@/components/ory/flow-card";
import { FlowBootstrap } from "@/components/ory/flow-session";
import config from "@/ory.config";

export default async function RecoveryPage(props: OryPageParams) {
  const searchParams = await props.searchParams;
  if (!searchParams.flow) {
    return <FlowBootstrap flowType="recovery" />;
  }

  const flow = await getRecoveryFlow(config, searchParams);

  if (!flow) {
    return null;
  }

  return <FlowCard flowType="recovery" ui={flow.ui} title="Recover account" description="Use your email or recovery code to regain access." footer={{ href: "/auth/login", label: "Back to login" }} />;
}
