import { Settings } from "@ory/elements-react/theme";
import { getSettingsFlow, OryPageParams } from "@ory/nextjs/app";

import config from "@/ory.config";

export default async function SettingsPage(props: OryPageParams) {
  const flow = await getSettingsFlow(config, props.searchParams);

  if (!flow) {
    return null;
  }

  return (
    <div className="flex justify-center mt-16">
      <Settings flow={flow} config={config} />
    </div>
  );
}
