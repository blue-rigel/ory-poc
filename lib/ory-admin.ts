import { Configuration, IdentityApi, OAuth2Api } from "@ory/client";
import { ORY_SDK_URL } from "@/lib/ory-sdk";

// Identity Admin API — requires a project API key with admin scope.
// Server-only: never import this module from a client component.
if (typeof window !== "undefined") {
  throw new Error("lib/ory-admin.ts must not be imported into client code.");
}
function adminConfiguration() {
  const accessToken = process.env.ORY_PROJECT_API_TOKEN;
  if (!accessToken) {
    throw new Error("ORY_PROJECT_API_TOKEN is required for Ory admin APIs.");
  }

  return new Configuration({ basePath: ORY_SDK_URL, accessToken });
}

export const oryIdentityAdmin = new IdentityApi(adminConfiguration());
export const oryOAuthAdmin = new OAuth2Api(adminConfiguration());
