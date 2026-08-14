import { Recovery } from "@ory/elements-react/theme";
import { getRecoveryFlow, OryPageParams } from "@ory/nextjs/app";

import config from "@/ory.config";

export default async function RecoveryPage(props: OryPageParams) {
  const flow = await getRecoveryFlow(config, props.searchParams);

  if (!flow) {
    return null;
  }

  return (
    <div className="flex justify-center mt-16">
      <Recovery flow={flow} config={config} />
    </div>
  );
}
