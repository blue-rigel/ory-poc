import { getSettingsFlow, OryPageParams } from "@ory/nextjs/app";
import { isAxiosError } from "axios";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { FlowCard } from "@/components/ory/flow-card";
import { oryFrontend } from "@/lib/ory-sdk";
import config from "@/ory.config";

export default async function SettingsPage(props: OryPageParams) {
  const cookie = (await headers()).get("cookie") ?? "";
  const sessionState = await getSessionState(cookie);

  if (sessionState === "anonymous") {
    redirect("/self-service/login/browser?return_to=/auth/settings");
  }

  if (sessionState === "step-up-required") {
    redirect("/self-service/login/browser?refresh=true&aal=aal2&return_to=/auth/settings");
  }

  const flow = await getSettingsFlow(config, props.searchParams);

  if (!flow) {
    return null;
  }

  return <FlowCard ui={flow.ui} title="Account settings" description="Manage your profile and authentication methods." footer={{ href: "/profile", label: "Back to profile" }} />;
}

async function getSessionState(cookie: string) {
  try {
    await oryFrontend.toSession({ cookie });
    return "authenticated" as const;
  } catch (error) {
    if (!isAxiosError(error)) {
      throw error;
    }

    if (error.response?.data?.error?.id === "session_aal2_required") {
      return "step-up-required" as const;
    }

    if (error.response?.status === 401) {
      return "anonymous" as const;
    }

    throw error;
  }
}
