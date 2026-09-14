import { getVerificationFlow, OryPageParams } from "@ory/nextjs/app";

import { FlowCard } from "@/components/ory/flow-card";
import { FlowBootstrap } from "@/components/ory/flow-session";
import config from "@/ory.config";

export default async function VerificationPage(props: OryPageParams) {
  const searchParams = await props.searchParams;
  if (!searchParams.flow) {
    return <FlowBootstrap flowType="verification" />;
  }

  const flow = await getVerificationFlow(config, searchParams);

  if (!flow) {
    return null;
  }

  return <FlowCard flowId={flow.id} flowType="verification" ui={flow.ui} title="Verify account" description="Confirm your email address to finish setting up your account." />;
}
