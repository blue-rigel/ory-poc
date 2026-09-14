import { getRegistrationFlow, OryPageParams } from "@ory/nextjs/app";

import { FlowCard } from "@/components/ory/flow-card";
import { FlowBootstrap } from "@/components/ory/flow-session";
import config from "@/ory.config";

export default async function RegistrationPage(props: OryPageParams) {
  const searchParams = await props.searchParams;
  if (!searchParams.flow) {
    return <FlowBootstrap flowType="registration" />;
  }

  const flow = await getRegistrationFlow(config, searchParams);

  if (!flow) {
    return null;
  }

  return <FlowCard flowId={flow.id} flowType="registration" ui={flow.ui} title="Create account" description="Register with Ory to continue." footer={{ href: "/login", label: "Already have an account? Log in" }} />;
}
