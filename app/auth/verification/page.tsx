import { Verification } from "@ory/elements-react/theme";
import { getVerificationFlow, OryPageParams } from "@ory/nextjs/app";

import config from "@/ory.config";

export default async function VerificationPage(props: OryPageParams) {
  const flow = await getVerificationFlow(config, props.searchParams);

  if (!flow) {
    return null;
  }

  return (
    <div className="flex justify-center mt-16">
      <Verification flow={flow} config={config} />
    </div>
  );
}
