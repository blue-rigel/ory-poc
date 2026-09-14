import { getVerificationFlow, OryPageParams } from "@ory/nextjs/app";

import { FlowCard } from "@/components/ory/flow-card";
import config from "@/ory.config";

export default async function VerificationPage(props: OryPageParams) {
  const flow = await getVerificationFlow(config, props.searchParams);

  if (!flow) {
    return null;
  }

  return <FlowCard ui={flow.ui} title="Verify account" description="Confirm your email address to finish setting up your account." />;
}
