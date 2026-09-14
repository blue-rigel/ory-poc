import { getRegistrationFlow, OryPageParams } from "@ory/nextjs/app";

import { FlowCard } from "@/components/ory/flow-card";
import config from "@/ory.config";

export default async function RegistrationPage(props: OryPageParams) {
  const flow = await getRegistrationFlow(config, props.searchParams);

  if (!flow) {
    return null;
  }

  return <FlowCard ui={flow.ui} title="Create account" description="Register with Ory to continue." footer={{ href: "/login", label: "Already have an account? Log in" }} />;
}
